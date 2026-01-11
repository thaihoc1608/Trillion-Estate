/**
 * Script: Generate Embeddings cho tất cả Posts
 * 
 * Chạy script này MỘT LẦN sau khi deploy code mới
 * để tạo embeddings cho tất cả posts hiện có trong database
 * 
 * Usage:
 *   node scripts/generateAllEmbeddings.js
 * 
 * Options:
 *   --force: Re-generate embeddings cho cả posts đã có embedding
 *   --batch-size=50: Số posts xử lý mỗi batch
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelPost = require('../src/models/post.model');
const { getChatbotInstance } = require('../src/utils/Chatbot/chatbot');

// Parse command line arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');
const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;

console.log('🚀 Script Generate Embeddings');
console.log('================================');
console.log(`Force regenerate: ${forceRegenerate}`);
console.log(`Batch size: ${batchSize}`);
console.log('');

/**
 * Connect tới MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.CONNECT_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Đã kết nối MongoDB\n');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
}

/**
 * Lấy danh sách posts cần generate embedding
 */
async function getPostsToProcess() {
    const query = { status: 'active' };

    if (!forceRegenerate) {
        // Chỉ lấy posts chưa có embedding
        query.embedding = { $exists: false };
    }

    const posts = await modelPost.find(query).select('_id title').lean();
    return posts;
}

/**
 * Main function
 */
async function main() {
    try {
        // Connect database
        await connectDB();

        // Get chatbot instance
        const chatbot = getChatbotInstance();
        await chatbot.initialize();

        // Get posts to process
        console.log('🔍 Đang tìm posts cần xử lý...\n');
        const posts = await getPostsToProcess();

        if (posts.length === 0) {
            console.log('✅ Tất cả posts đã có embeddings!');
            process.exit(0);
        }

        console.log(`📊 Tìm thấy ${posts.length} posts cần generate embeddings`);
        console.log(`⏱️  Ước tính thời gian: ~${Math.ceil((posts.length * 1.2) / 60)} phút\n`);

        // Confirm before start
        if (!forceRegenerate && posts.length > 100) {
            console.log('⚠️  Số lượng posts lớn! Nhấn Ctrl+C để hủy, hoặc đợi 5 giây để tiếp tục...\n');
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Process in batches
        const postIds = posts.map((p) => p._id.toString());
        let processed = 0;
        let successful = 0;
        let failed = 0;

        const startTime = Date.now();

        // Progress callback
        const onProgress = (progress) => {
            processed++;
            if (progress.status === 'success') {
                successful++;
            } else {
                failed++;
            }

            const percentage = ((processed / posts.length) * 100).toFixed(1);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const avgTimePerPost = elapsed / processed;
            const remaining = Math.ceil((posts.length - processed) * avgTimePerPost);

            process.stdout.write(
                `\r⏳ Progress: ${processed}/${posts.length} (${percentage}%) | ` +
                `✅ ${successful} | ❌ ${failed} | ` +
                `⏱️  Còn ~${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
            );
        };

        // Chạy batch processing
        for (let i = 0; i < postIds.length; i += batchSize) {
            const batch = postIds.slice(i, i + batchSize);
            await chatbot.batchGenerateEmbeddings(batch, onProgress);
        }

        console.log('\n');

        // Summary
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        console.log('\n📊 KẾT QUẢ');
        console.log('================================');
        console.log(`✅ Thành công: ${successful} posts`);
        console.log(`❌ Thất bại: ${failed} posts`);
        console.log(`⏱️  Tổng thời gian: ${Math.floor(totalTime / 60)}:${String(totalTime % 60).padStart(2, '0')}`);
        console.log(`⚡ Trung bình: ${(totalTime / processed).toFixed(2)}s/post`);
        console.log('');

        // Get final stats
        const stats = await chatbot.getStats();
        console.log(`🎯 Vector Store Stats:`);
        console.log(`   - Total vectors: ${stats.vectorStore.totalVectors}`);
        console.log(`   - Dimensions: ${stats.vectorStore.dimensions}`);
        console.log('');

        console.log('✅ HOÀN THÀNH!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ LỖI:', error);
        process.exit(1);
    }
}

// Run
main();
