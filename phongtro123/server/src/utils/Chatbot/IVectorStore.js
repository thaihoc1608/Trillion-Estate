/**
 * Interface for Vector Store
 * Abstraction layer để dễ dàng swap giữa các implementation khác nhau
 * 
 * Implementation options:
 * - InMemoryVectorStore: Approach 1 (hiện tại)
 * - MongoDBAtlasVectorStore: Approach 2 (tương lai)
 * - PineconeVectorStore: Approach 3 (advanced)
 */

class IVectorStore {
    /**
     * Tìm các documents relevant nhất dựa trên embedding
     * @param {number[]} queryEmbedding - Vector embedding của câu hỏi
     * @param {number} limit - Số lượng kết quả cần trả về
     * @param {object} filters - Filters bổ sung (category, location, price range, etc.)
     * @returns {Promise<Array<{post: object, similarity: number}>>}
     */
    async findSimilar(queryEmbedding, limit = 5, filters = {}) {
        throw new Error('Method findSimilar() must be implemented');
    }

    /**
     * Thêm hoặc update embedding cho một post
     * @param {string} postId - ID của post
     * @param {number[]} embedding - Vector embedding
     * @param {object} metadata - Metadata bổ sung
     * @returns {Promise<void>}
     */
    async upsertEmbedding(postId, embedding, metadata = {}) {
        throw new Error('Method upsertEmbedding() must be implemented');
    }

    /**
     * Xóa embedding của một post
     * @param {string} postId - ID của post
     * @returns {Promise<void>}
     */
    async deleteEmbedding(postId) {
        throw new Error('Method deleteEmbedding() must be implemented');
    }

    /**
     * Lấy thống kê về vector store
     * @returns {Promise<object>} - {totalVectors: number, dimensions: number}
     */
    async getStats() {
        throw new Error('Method getStats() must be implemented');
    }

    /**
     * Kiểm tra xem post đã có embedding chưa
     * @param {string} postId - ID của post
     * @returns {Promise<boolean>}
     */
    async hasEmbedding(postId) {
        throw new Error('Method hasEmbedding() must be implemented');
    }
}

module.exports = IVectorStore;
