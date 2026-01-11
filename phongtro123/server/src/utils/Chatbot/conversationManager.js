/**
 * Conversation Context Manager
 * 
 * Quản lý lịch sử hội thoại của users
 * Approach 1: In-memory Map (đơn giản)
 * Tương lai: Redis để persist và scale
 */

class ConversationManager {
    constructor(options = {}) {
        this.conversations = new Map(); // userId -> messages[]
        this.maxMessages = options.maxMessages || 10; // Giữ tối đa 10 messages gần nhất
        this.ttl = options.ttl || 30 * 60 * 1000; // TTL: 30 phút
        this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // Cleanup mỗi 5 phút

        // Auto cleanup expired conversations
        this.startCleanupTimer();
    }

    /**
     * Thêm message vào conversation
     */
    addMessage(userId, role, content) {
        if (!userId) {
            console.warn('⚠️ userId is required for conversation tracking');
            return;
        }

        if (!this.conversations.has(userId)) {
            this.conversations.set(userId, {
                messages: [],
                lastActivity: Date.now(),
            });
        }

        const conversation = this.conversations.get(userId);

        // Thêm message mới
        conversation.messages.push({
            role, // 'user' hoặc 'assistant'
            content,
            timestamp: Date.now(),
        });

        // Giữ chỉ N messages gần nhất
        if (conversation.messages.length > this.maxMessages) {
            conversation.messages = conversation.messages.slice(-this.maxMessages);
        }

        // Update last activity
        conversation.lastActivity = Date.now();

        this.conversations.set(userId, conversation);

        // ✅ Debug log
        console.log(`💬 Saved message for ${userId}: ${role} - ${content.substring(0, 50)}...`);
        console.log(`📝 Total messages for ${userId}: ${conversation.messages.length}`);
    }

    /**
     * Lấy lịch sử conversation
     */
    getHistory(userId, limit = null) {
        if (!userId || !this.conversations.has(userId)) {
            console.log(`📭 No history for userId: ${userId}`);
            return [];
        }

        const conversation = this.conversations.get(userId);
        const messages = conversation.messages;

        if (limit && limit < messages.length) {
            const result = messages.slice(-limit);
            console.log(`📜 Retrieved ${result.length} messages for ${userId} (limit: ${limit})`);
            return result;
        }

        console.log(`📜 Retrieved ${messages.length} messages for ${userId} (all)`);
        return messages;
    }

    /**
     * Xóa conversation của user
     */
    clearConversation(userId) {
        if (userId) {
            this.conversations.delete(userId);
        }
    }

    /**
     * Cleanup expired conversations
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, conversation] of this.conversations) {
            if (now - conversation.lastActivity > this.ttl) {
                this.conversations.delete(userId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired conversations`);
        }
    }

    /**
     * Start auto cleanup timer
     */
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Stop cleanup timer (khi shutdown server)
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }

    /**
     * Get stats
     */
    getStats() {
        let totalMessages = 0;
        for (const conversation of this.conversations.values()) {
            totalMessages += conversation.messages.length;
        }

        return {
            activeConversations: this.conversations.size,
            totalMessages,
            maxMessages: this.maxMessages,
            ttl: this.ttl,
        };
    }
}

// Singleton instance
let instance = null;

module.exports = {
    ConversationManager,
    getInstance: (options) => {
        if (!instance) {
            instance = new ConversationManager(options);
        }
        return instance;
    },
};
