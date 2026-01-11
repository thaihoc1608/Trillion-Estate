/**
 * Vector Store Factory
 * 
 * Tự động chọn implementation dựa trên environment variable
 * Để dễ dàng swap giữa các approaches
 * 
 * Usage:
 *   const vectorStore = createVectorStore();
 * 
 * Environment Variables:
 *   VECTOR_STORE_TYPE=memory    (default, Approach 1)
 *   VECTOR_STORE_TYPE=atlas     (Approach 2, tương lai)
 */

require('dotenv').config();

const InMemoryVectorStore = require('./InMemoryVectorStore');
const MongoDBAtlasVectorStore = require('./MongoDBAtlasVectorStore');

function createVectorStore() {
    const storeType = process.env.VECTOR_STORE_TYPE || 'memory';

    console.log(`🔧 Vector Store Type: ${storeType}`);

    switch (storeType) {
        case 'atlas':
            console.log('✅ Using MongoDB Atlas Vector Search (Approach 2)');
            return new MongoDBAtlasVectorStore();

        case 'memory':
        default:
            console.log('✅ Using In-Memory Vector Store (Approach 1)');
            return new InMemoryVectorStore();
    }
}

module.exports = { createVectorStore };
