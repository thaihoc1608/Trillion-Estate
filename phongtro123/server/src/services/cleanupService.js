/**
 * Cleanup Service - Tự động xóa posts hết hạn
 * 
 * Chạy mỗi ngày lúc 00:00 (nửa đêm) để:
 * - Tìm posts có endDate < now
 * - Xóa posts khỏi database
 * - Xóa embeddings và reload vector store
 */

const cron = require('node-cron');
const modelPost = require('../models/post.model');

class CleanupService {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Xóa posts hết hạn
     */
    async cleanupExpiredPosts() {
        if (this.isRunning) {
            console.log('⚠️  Cleanup đang chạy, skip...');
            return;
        }

        this.isRunning = true;
        console.log('🧹 Bắt đầu cleanup posts hết hạn...');

        try {
            const now = new Date();

            // Tìm posts hết hạn
            const expiredPosts = await modelPost.find({
                endDate: { $lt: now },
            });

            if (expiredPosts.length === 0) {
                console.log('✅ Không có posts hết hạn');
                return { deleted: 0, errors: [] };
            }

            console.log(`📊 Tìm thấy ${expiredPosts.length} posts hết hạn`);

            // Xóa từng post
            let deleted = 0;
            const errors = [];

            for (const post of expiredPosts) {
                try {
                    await modelPost.findByIdAndDelete(post._id);
                    deleted++;
                    console.log(`   ✅ Deleted: ${post.title.substring(0, 50)}... (expired: ${post.endDate.toLocaleDateString()})`);
                } catch (error) {
                    console.error(`   ❌ Error deleting post ${post._id}:`, error.message);
                    errors.push({ postId: post._id, error: error.message });
                }
            }

            console.log(`\n📊 Kết quả cleanup:`);
            console.log(`   ✅ Đã xóa: ${deleted} posts`);
            console.log(`   ❌ Lỗi: ${errors.length} posts`);

            // Reload chatbot vector store
            if (deleted > 0) {
                try {
                    const { getChatbotInstance } = require('../utils/Chatbot/chatbot');
                    const chatbot = getChatbotInstance();
                    await chatbot.reload();
                    console.log('   🔄 Đã reload chatbot vector store');
                } catch (error) {
                    console.error('   ⚠️  Không thể reload chatbot:', error.message);
                }
            }

            return { deleted, errors };
        } catch (error) {
            console.error('❌ Lỗi trong cleanup service:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start cron job - chạy mỗi ngày lúc 00:00
     */
    startCronJob() {
        // Cron format: second minute hour day month weekday
        // '0 0 * * *' = Mỗi ngày lúc 00:00
        const cronSchedule = '0 0 * * *';

        console.log('⏰ Đã schedule cleanup job: Mỗi ngày lúc 00:00');

        cron.schedule(cronSchedule, async () => {
            console.log('\n🕐 [Cron] Cleanup job triggered at:', new Date().toLocaleString());
            try {
                await this.cleanupExpiredPosts();
            } catch (error) {
                console.error('❌ [Cron] Cleanup failed:', error);
            }
        });

        // Có thể test ngay bằng cách uncomment dòng dưới:
        // this.cleanupExpiredPosts();
    }

    /**
     * Manual cleanup - gọi từ API endpoint
     */
    async manualCleanup() {
        console.log('🔧 Manual cleanup triggered');
        return await this.cleanupExpiredPosts();
    }
}

// Singleton instance
const cleanupService = new CleanupService();

module.exports = cleanupService;
