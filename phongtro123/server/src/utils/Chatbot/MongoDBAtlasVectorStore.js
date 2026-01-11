const IVectorStore = require('./IVectorStore');

/**
 * MongoDB Atlas Vector Search Implementation
 * Approach 2: Native vector search với MongoDB Atlas
 * 
 * ⚠️ REQUIREMENTS:
 * - MongoDB Atlas cluster (M10+) hoặc free tier với vector search enabled
 * - Vector Search Index đã được tạo
 * 
 * Setup Steps:
 * 1. Create Vector Search Index trong MongoDB Atlas UI:
 *    - Collection: posts
 *    - Index name: vector_index
 *    - Field: embedding
 *    - Dimensions: 768
 *    - Similarity: cosine
 * 
 * 2. Update .env:
 *    VECTOR_STORE_TYPE=atlas
 * 
 * 3. Deploy code - vector store sẽ tự động switch
 * 
 * Pros:
 * - ⚡ Cực nhanh, native vector search
 * - 📈 Scale tốt với millions posts
 * - 🔍 Built-in indexing
 * - 💾 No memory overhead
 * 
 * Cons:
 * - 💰 Cần MongoDB Atlas (có free tier)
 * - ⚙️ Setup phức tạp hơn
 */
class MongoDBAtlasVectorStore extends IVectorStore {
    constructor() {
        super();
        this.indexName = 'vector_index';
        this.model = require('../../models/post.model');
    }

    /**
     * Tìm documents tương tự sử dụng Atlas Vector Search
     */
    async findSimilar(queryEmbedding, limit = 5, filters = {}) {
        try {
            // Build aggregation pipeline
            const pipeline = [
                {
                    // Vector Search stage
                    $vectorSearch: {
                        index: this.indexName,
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: limit * 10, // Candidates to scan
                        limit: limit * 2, // Return more for filtering
                    },
                },
                {
                    // Add similarity score
                    $addFields: {
                        similarity: { $meta: 'vectorSearchScore' },
                    },
                },
                {
                    // Filter by status
                    $match: {
                        status: 'active',
                        ...this.buildFilters(filters),
                    },
                },
                {
                    // Limit results
                    $limit: limit,
                },
                {
                    // Project fields we need
                    $project: {
                        _id: 1,
                        title: 1,
                        price: 1,
                        location: 1,
                        category: 1,
                        area: 1,
                        options: 1,
                        phone: 1,
                        username: 1,
                        similarity: 1,
                    },
                },
            ];

            const results = await this.model.aggregate(pipeline);

            // Format results
            return results.map((doc) => ({
                post: doc,
                similarity: doc.similarity,
                postId: doc._id.toString(),
            }));
        } catch (error) {
            console.error('❌ Atlas Vector Search error:', error);
            throw error;
        }
    }

    /**
     * Build MongoDB filters từ search filters
     */
    buildFilters(filters) {
        const mongoFilters = {};

        if (filters.category) {
            mongoFilters.category = filters.category;
        }

        if (filters.location) {
            mongoFilters.location = { $regex: filters.location, $options: 'i' };
        }

        if (filters.minPrice || filters.maxPrice) {
            mongoFilters.price = {};
            if (filters.minPrice) mongoFilters.price.$gte = filters.minPrice;
            if (filters.maxPrice) mongoFilters.price.$lte = filters.maxPrice;
        }

        if (filters.minArea || filters.maxArea) {
            mongoFilters.area = {};
            if (filters.minArea) mongoFilters.area.$gte = filters.minArea;
            if (filters.maxArea) mongoFilters.area.$lte = filters.maxArea;
        }

        return mongoFilters;
    }

    /**
     * Upsert embedding - chỉ cần update vào MongoDB
     * Index tự động update
     */
    async upsertEmbedding(postId, embedding, metadata = {}) {
        try {
            await this.model.findByIdAndUpdate(postId, {
                embedding,
                embeddingText: metadata.embeddingText,
                embeddingUpdatedAt: new Date(),
            });

            console.log(`✅ Updated embedding cho post ${postId} (Atlas auto-indexed)`);
        } catch (error) {
            console.error(`❌ Lỗi upsert embedding cho post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * Delete embedding
     */
    async deleteEmbedding(postId) {
        try {
            await this.model.findByIdAndUpdate(postId, {
                $unset: { embedding: '', embeddingText: '', embeddingUpdatedAt: '' },
            });

            console.log(`✅ Deleted embedding cho post ${postId}`);
        } catch (error) {
            console.error(`❌ Lỗi delete embedding cho post ${postId}:`, error);
            throw error;
        }
    }

    /**
     * Get stats
     */
    async getStats() {
        const count = await this.model.countDocuments({
            embedding: { $exists: true, $ne: null },
        });

        return {
            totalVectors: count,
            dimensions: 768,
            storageType: 'mongodb-atlas',
            indexName: this.indexName,
        };
    }

    /**
     * Check if post has embedding
     */
    async hasEmbedding(postId) {
        const post = await this.model.findById(postId).select('embedding');
        return post && post.embedding && post.embedding.length > 0;
    }
}

module.exports = MongoDBAtlasVectorStore;
