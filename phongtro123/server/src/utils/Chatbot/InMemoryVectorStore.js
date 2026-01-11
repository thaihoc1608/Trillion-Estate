const IVectorStore = require('./IVectorStore');
const modelPost = require('../../models/post.model');

/**
 * In-Memory Vector Store với MongoDB cache
 * Approach 1: Load embeddings vào memory, search bằng cosine similarity
 * 
 * Pros:
 * - Đơn giản, không cần external services
 * - Hoạt động với local MongoDB
 * - Fast search sau khi load vào memory
 * 
 * Cons:
 * - Cần restart để reload embeddings mới
 * - Memory usage cao với >10k posts
 * - Không scale tốt với millions posts
 */
class InMemoryVectorStore extends IVectorStore {
    constructor() {
        super();
        this.embeddings = new Map(); // postId -> {embedding, post}
        this.initialized = false;
    }

    /**
     * Load tất cả embeddings từ MongoDB vào memory
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🔄 Đang load embeddings vào memory...');
        const startTime = Date.now();

        try {
            // Lấy posts có embedding VÀ chưa hết hạn
            const now = new Date();
            const posts = await modelPost.find({
                embedding: { $exists: true },
                endDate: { $gte: now }, // ✅ Option 1: Chỉ load posts chưa hết hạn
            }).select('_id title price location category embedding embeddingText area options phone username status endDate');

            console.log(`📊 Found ${posts.length} posts in database`);

            let loaded = 0;
            posts.forEach((post) => {
                // Check embedding hợp lệ
                const hasValidEmbedding = post.embedding &&
                    Array.isArray(post.embedding) &&
                    post.embedding.length > 0;

                if (hasValidEmbedding) {
                    this.embeddings.set(post._id.toString(), {
                        embedding: post.embedding,
                        post: post.toObject(),
                    });
                    loaded++;
                } else {
                    console.log(`⚠️  Post ${post._id} có embedding invalid:`, {
                        exists: !!post.embedding,
                        isArray: Array.isArray(post.embedding),
                        length: post.embedding?.length || 0
                    });
                }
            });

            const loadTime = Date.now() - startTime;
            console.log(`✅ Đã load ${this.embeddings.size} embeddings vào memory (${loadTime}ms)`);
            this.initialized = true;
        } catch (error) {
            console.error('❌ Lỗi khi load embeddings:', error);
            throw error;
        }
    }

    /**
     * Tính cosine similarity giữa 2 vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors phải có cùng dimensions');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Tìm posts tương tự nhất
     */
    async findSimilar(queryEmbedding, limit = 5, filters = {}) {
        // Đảm bảo đã initialize
        if (!this.initialized) {
            await this.initialize();
        }

        const results = [];

        // Tính similarity với tất cả embeddings
        for (const [postId, data] of this.embeddings) {
            const post = data.post;

            // ✅ Option 2: Skip posts hết hạn (realtime check)
            if (post.endDate && new Date(post.endDate) < new Date()) {
                continue;
            }

            // Apply filters
            if (filters.category && post.category !== filters.category) continue;
            if (filters.location && !post.location.includes(filters.location)) continue;
            if (filters.minPrice && post.price < filters.minPrice) continue;
            if (filters.maxPrice && post.price > filters.maxPrice) continue;
            if (filters.minArea && post.area < filters.minArea) continue;
            if (filters.maxArea && post.area > filters.maxArea) continue;

            const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);

            results.push({
                post,
                similarity,
                postId,
            });
        }

        // Sort theo similarity giảm dần, lấy top N
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }

    /**
     * Thêm/update embedding cho post
     */
    async upsertEmbedding(postId, embedding, metadata = {}) {
        try {
            // Update vào MongoDB
            await modelPost.findByIdAndUpdate(postId, {
                embedding,
                embeddingText: metadata.embeddingText,
                embeddingUpdatedAt: new Date(),
            });

            // Update trong memory cache
            const post = await modelPost.findById(postId).select('_id title price location category embedding area options');

            if (post && post.status === 'active') {
                this.embeddings.set(postId, {
                    embedding,
                    post: post.toObject(),
                });
            }

            console.log(`✅ Updated embedding cho post ${postId}`);
        } catch (error) {
            console.error(`❌ Lỗi upsert embedding cho post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * Xóa embedding
     */
    async deleteEmbedding(postId) {
        try {
            // Xóa trong MongoDB
            await modelPost.findByIdAndUpdate(postId, {
                $unset: { embedding: '', embeddingText: '', embeddingUpdatedAt: '' },
            });

            // Xóa trong memory
            this.embeddings.delete(postId);

            console.log(`✅ Deleted embedding cho post ${postId}`);
        } catch (error) {
            console.error(`❌ Lỗi delete embedding cho post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * Lấy stats
     */
    async getStats() {
        if (!this.initialized) {
            await this.initialize();
        }

        const firstEmbedding = this.embeddings.values().next().value;
        const dimensions = firstEmbedding ? firstEmbedding.embedding.length : 0;

        return {
            totalVectors: this.embeddings.size,
            dimensions,
            storageType: 'in-memory',
        };
    }

    /**
     * Kiểm tra post có embedding chưa
     */
    async hasEmbedding(postId) {
        if (!this.initialized) {
            await this.initialize();
        }

        return this.embeddings.has(postId);
    }

    /**
     * Reload embeddings từ database (gọi sau khi có posts mới)
     */
    async reload() {
        this.initialized = false;
        this.embeddings.clear();
        await this.initialize();
    }
}

module.exports = InMemoryVectorStore;
