/**
 * Force Regenerate ALL Embeddings
 * 
 * Re-generate embeddings cho TẤT CẢ posts (force overwrite)
 * để update với features mới
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelPost = require('../src/models/post.model');

async function regenerateAllEmbeddings() {
    try {
        // Connect DB
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Connected to MongoDB');

        // Lấy TẤT CẢ posts active
        const posts = await modelPost.find({ status: 'active' });

        console.log(`📊 Found ${posts.length} active posts`);

        if (posts.length === 0) {
            console.log('⚠️  No active posts found');
            process.exit(0);
        }

        // Import chatbot
        const { getChatbotInstance } = require('../src/utils/Chatbot/chatbot');

        console.log('🤖 Khởi động chatbot...');
        const chatbot = getChatbotInstance();
        await chatbot.initialize();

        // FORCE regenerate ALL embeddings
        let generated = 0;
        for (const post of posts) {
            try {
                console.log(`🔄 [${generated + 1}/${posts.length}] Regenerating embedding for: ${post.title.substring(0, 50)}...`);

                // Generate embedding (will overwrite existing)
                await chatbot.generatePostEmbedding(post._id);

                generated++;

                // Delay để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`❌ Failed for post ${post._id}:`, error.message);
            }
        }

        // Reload chatbot
        console.log('\n🔄 Reloading chatbot...');
        await chatbot.reload();

        console.log(`\n✅ Successfully regenerated ${generated}/${posts.length} embeddings`);
        console.log('✅ Chatbot reloaded with new embeddings (includes features)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

regenerateAllEmbeddings();
