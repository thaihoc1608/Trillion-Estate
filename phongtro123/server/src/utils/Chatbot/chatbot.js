const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const modelPost = require('../../models/post.model');
const { createVectorStore } = require('./vectorStoreFactory');
const { buildPrompt } = require('./promptTemplates');
const { getInstance: getConversationManager } = require('./conversationManager');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Đổi sang gemini-1.5-flash (stable, quota cao hơn gemini-2.0-flash-exp)
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

// Initialize Vector Store (sử dụng factory - dễ swap implementation)
// 🔄 Để nâng cấp lên Approach 2: set VECTOR_STORE_TYPE=atlas trong .env
const vectorStore = createVectorStore();

// Initialize Conversation Manager
const conversationManager = getConversationManager({
    maxMessages: 10,
    ttl: 30 * 60 * 1000, // 30 phút
});

/**
 * Smart Chatbot với RAG Pattern
 * 
 * Kiến trúc:
 * 1. Generate embedding cho câu hỏi user
 * 2. Tìm top N posts relevant nhất (semantic search)
 * 3. Build prompt với relevant posts + conversation history
 * 4. Generate response từ Gemini
 * 5. Save vào conversation history
 */
class SmartChatbot {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize chatbot (load embeddings vào memory)
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🤖 Khởi động Smart Chatbot...');

        try {
            // Load embeddings vào memory
            await vectorStore.initialize();

            const stats = await vectorStore.getStats();
            console.log(`✅ Chatbot sẵn sàng! Đã load ${stats.totalVectors} embeddings (${stats.dimensions} dimensions)`);

            this.initialized = true;
        } catch (error) {
            console.error('❌ Lỗi khởi động chatbot:', error);
            throw error;
        }
    }

    /**
     * Generate embedding cho text
     */
    async generateEmbedding(text) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('❌ Lỗi generate embedding:', error);
            throw error;
        }
    }

    /**
     * Parse filters từ câu hỏi (optional, có thể dùng AI hoặc regex)
     * Hiện tại: return empty filters, để AI tự tìm based on semantic similarity
     */
    parseFilters(question) {
        const filters = {};

        // Có thể thêm regex/NLP để detect:
        // - "dưới 2 triệu" -> maxPrice
        // - "gần ĐHQG" -> location
        // - "có điều hòa" -> amenities
        // Hoặc dùng Gemini để extract (tốn thêm API call)

        return filters;
    }

    /**
     * Detect user intent: greeting, search, question, etc.
     */
    detectIntent(question) {
        const q = question.toLowerCase().trim();

        // Greetings & introductions
        const greetingPatterns = [
            /^(xin )?chào/i,
            /^hi$|^hello$/i,
            /^bạn là ai/i,
            /^bạn làm (gì|được gì)/i,
            /^giới thiệu/i,
            /^có thể giúp (gì|tôi)/i,
        ];

        for (const pattern of greetingPatterns) {
            if (pattern.test(q)) {
                return 'greeting';
            }
        }

        // Search keywords
        const searchKeywords = ['tìm', 'cần', 'muốn', 'có', 'phòng', 'nhà', 'căn hộ', 'giá', 'triệu', 'm²'];
        const hasSearchKeyword = searchKeywords.some(kw => q.includes(kw));

        if (hasSearchKeyword) {
            return 'search';
        }

        // Default: treat as question/search
        return 'question';
    }

    /**
     * Hàm chính: Trả lời câu hỏi user
     */
    async askQuestion(question, userId = null) {
        try {
            // Ensure initialized
            if (!this.initialized) {
                await this.initialize();
            }

            const startTime = Date.now();
            console.log('🔍 Đang phân tích câu hỏi...');

            // ✅ Step 1: Detect intent
            const intent = this.detectIntent(question);
            console.log(`🎯 Intent detected: ${intent}`);

            // ✅ Step 2: Handle greetings directly (no semantic search)
            if (intent === 'greeting') {
                const conversationHistory = userId ? conversationManager.getHistory(userId, 5) : [];

                const greetingPrompt = `Bạn là trợ lý AI thông minh của website **Phòng Trọ 123**.

Khách hàng vừa chào/hỏi về bạn: "${question}"

HÃY TRẢ LỜI:
1. Chào lại TỰ NHIÊN, THÂN THIỆN (1 câu ngắn)
2. Giới thiệu bạn có thể GIÚP GÌ:
   - Tìm phòng trọ/căn hộ phù hợp
   - Tư vấn giá, vị trí
   - So sánh các options
3. Hỏi: "Bạn cần tìm phòng không?" hoặc "Tôi có thể giúp gì?"

⚠️ QUY TẮC QUAN TRỌNG:
- KHÔNG nói "xin lỗi"
- KHÔNG nói "không có phòng" 
- KHÔNG nói "chưa có phòng phù hợp"
- KHÔNG hỏi tiêu chí (giá, vị trí...) - họ chưa muốn tìm!
- Chỉ CHÀO + GIỚI THIỆU + HỎI họ cần gì

Trả lời ngắn gọn 2-3 câu, có emoji 😊🏠`;

                const result = await chatModel.generateContent(greetingPrompt);
                const answer = result.response.text();

                // Save to history
                if (userId) {
                    conversationManager.addMessage(userId, 'user', question);
                    conversationManager.addMessage(userId, 'assistant', answer);
                }

                return {
                    answer,
                    metadata: {
                        intent,
                        relevantPosts: [],
                        responseTime: Date.now() - startTime,
                    },
                };
            }

            // ✅ Step 3: For search/question → Continue with semantic search
            // Step 3.1: Generate embedding cho câu hỏi
            const questionEmbedding = await this.generateEmbedding(question);

            // TODO: Extract filters từ question (future enhancement)
            const filters = this.parseFilters(question);

            // Step 3: Tìm relevant posts
            console.log('🔍 Đang tìm phòng phù hợp...');
            const relevantPosts = await vectorStore.findSimilar(questionEmbedding, 5, filters);

            // Filter out low similarity results (tăng threshold lên 0.5 để chặt chẽ hơn)
            const SIMILARITY_THRESHOLD = 0.5;
            const goodMatches = relevantPosts.filter((item) => item.similarity > SIMILARITY_THRESHOLD);

            console.log(`📊 Found ${relevantPosts.length} posts, ${goodMatches.length} có độ phù hợp cao (>${SIMILARITY_THRESHOLD})`);

            // Step 4: Get conversation history
            const conversationHistory = userId ? conversationManager.getHistory(userId, 5) : [];

            // Step 5: Build prompt
            const prompt = buildPrompt(question, goodMatches, conversationHistory);

            // Step 6: Generate response
            console.log('💬 Đang tạo câu trả lời...');
            const result = await chatModel.generateContent(prompt);
            const answer = result.response.text();

            // Step 7: Save to conversation history
            if (userId) {
                conversationManager.addMessage(userId, 'user', question);
                conversationManager.addMessage(userId, 'assistant', answer);
            }

            const responseTime = Date.now() - startTime;
            console.log(`✅ Hoàn thành trong ${responseTime}ms`);

            return {
                answer,
                metadata: {
                    postsFound: relevantPosts.length,
                    postsUsed: goodMatches.length,
                    responseTime,
                    hasConversationContext: conversationHistory.length > 0,
                },
            };
        } catch (error) {
            console.error('❌ Lỗi trong askQuestion:', error);

            // Fallback response
            return {
                answer: 'Xin lỗi, tôi đang gặp chút vấn đề kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
                metadata: {
                    error: error.message,
                    postsFound: 0,
                    postsUsed: 0,
                },
            };
        }
    }

    /**
     * Generate và save embedding cho 1 post
     */
    async generatePostEmbedding(postId) {
        try {
            const post = await modelPost.findById(postId);
            if (!post) {
                throw new Error(`Post ${postId} không tồn tại`);
            }

            // Tạo text representation của post để embed
            const embeddingText = this.createEmbeddingText(post);

            // Generate embedding
            console.log(`🔄 Generating embedding cho post ${postId}...`);
            const embedding = await this.generateEmbedding(embeddingText);

            // Save vào database và update vector store
            await vectorStore.upsertEmbedding(postId, embedding, { embeddingText });

            console.log(`✅ Đã tạo embedding cho post ${postId}`);

            return { success: true, embedding };
        } catch (error) {
            console.error(`❌ Lỗi generate embedding cho post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * Tạo text từ post để generate embedding
     * Text này cần chứa tất cả thông tin quan trọng
     */
    createEmbeddingText(post) {
        let text = `${post.title}. `;
        text += `Giá ${post.price} VND mỗi tháng. `;
        text += `Diện tích ${post.area} m². `;
        text += `Địa điểm: ${post.location}. `;
        text += `Loại: ${post.category}. `;

        // Thêm description (limit 200 chars để không quá dài)
        if (post.description) {
            const desc = post.description.substring(0, 200);
            text += `Mô tả: ${desc}. `;
        }

        // ✨ XỬ LÝ OPTIONS là ARRAY of STRINGS (từ MongoDB)
        if (post.options && Array.isArray(post.options) && post.options.length > 0) {
            // Options là array chứa tên tiện ích
            // ["Có máy giặt", "Giờ giấc tự do", "Có thang máy", ...]
            text += `Tiện ích và điểm nổi bật: ${post.options.join(', ')}. `;
        }

        return text;
    }

    /**
     * Batch generate embeddings cho nhiều posts
     */
    async batchGenerateEmbeddings(postIds, onProgress = null) {
        const results = {
            success: [],
            failed: [],
        };

        for (let i = 0; i < postIds.length; i++) {
            const postId = postIds[i];

            try {
                await this.generatePostEmbedding(postId);
                results.success.push(postId);

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: postIds.length,
                        postId,
                        status: 'success',
                    });
                }

                // Rate limiting: sleep 100ms giữa các requests
                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                results.failed.push({ postId, error: error.message });

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: postIds.length,
                        postId,
                        status: 'failed',
                        error: error.message,
                    });
                }
            }
        }

        return results;
    }

    /**
     * Get chatbot stats
     */
    async getStats() {
        const vectorStats = await vectorStore.getStats();
        const conversationStats = conversationManager.getStats();

        return {
            vectorStore: vectorStats,
            conversations: conversationStats,
            initialized: this.initialized,
        };
    }

    /**
     * Reload embeddings (sau khi có posts mới)
     */
    async reload() {
        console.log('🔄 Reloading vector store...');
        await vectorStore.reload();
        console.log('✅ Vector store reloaded');
    }

    /**
     * Clear conversation của user
     */
    clearConversation(userId) {
        conversationManager.clearConversation(userId);
    }
}

// Singleton instance
let chatbotInstance = null;

/**
 * Get singleton instance của chatbot
 */
function getChatbotInstance() {
    if (!chatbotInstance) {
        chatbotInstance = new SmartChatbot();
    }
    return chatbotInstance;
}

// Legacy function để backward compatible với code cũ
async function askQuestion(question) {
    const chatbot = getChatbotInstance();
    const result = await chatbot.askQuestion(question);
    return result.answer; // Chỉ return answer để compatible
}

module.exports = {
    SmartChatbot,
    getChatbotInstance,
    askQuestion, // Legacy export
};
