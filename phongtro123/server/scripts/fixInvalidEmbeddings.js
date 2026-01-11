/**
 * Fix Invalid Embeddings Script
 * 
 * Tìm và fix các posts có embedding invalid (empty array)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelPost = require('../src/models/post.model');

async function fixInvalidEmbeddings() {
    try {
        // Connect DB
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Connected to MongoDB');

        // Tìm posts có embedding rỗng hoặc invalid
        const invalidPosts = await modelPost.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: null },
                { embedding: [] },
                { embedding: { $size: 0 } },
            ],
            status: 'active', // Chỉ fix posts active
        });

        console.log(`📊 Found ${invalidPosts.length} posts with invalid embeddings`);

        if (invalidPosts.length === 0) {
            console.log('✅ All active posts have valid embeddings!');
            process.exit(0);
        }

        // Import chatbot
        const { getChatbotInstance } = require('../src/utils/Chatbot/chatbot');

        console.log('🤖 Khởi động chatbot...');
        const chatbot = getChatbotInstance();
        await chatbot.initialize();

        // Generate embeddings
        let fixed = 0;
        for (const post of invalidPosts) {
            try {
                console.log(`🔄 Generating embedding for post ${post._id}...`);
                await chatbot.generatePostEmbedding(post._id);
                fixed++;
                console.log(`✅ Fixed ${fixed}/${invalidPosts.length}`);
            } catch (error) {
                console.error(`❌ Failed to fix post ${post._id}:`, error.message);
            }
        }

        // Reload chatbot
        console.log('🔄 Reloading chatbot...');
        await chatbot.reload();

        console.log(`\n✅ Fixed ${fixed}/${invalidPosts.length} posts`);
        console.log('✅ Chatbot reloaded successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixInvalidEmbeddings();
