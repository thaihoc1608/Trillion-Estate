/**
 * Debug script: Check posts status và embeddings
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const modelPost = require(path.join(__dirname, '../src/models/post.model'));

async function checkPosts() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Connected to MongoDB\n');

        // Count total posts
        const totalPosts = await modelPost.countDocuments();
        console.log(`📊 Total posts: ${totalPosts}`);

        // Count by status
        const activePosts = await modelPost.countDocuments({ status: 'active' });
        const inactivePosts = await modelPost.countDocuments({ status: 'inactive' });
        console.log(`   - Active: ${activePosts}`);
        console.log(`   - Inactive: ${inactivePosts}\n`);

        // Count posts with embeddings
        const postsWithEmbedding = await modelPost.countDocuments({
            embedding: { $exists: true, $ne: null, $ne: [] }
        });
        console.log(`📊 Posts with embeddings: ${postsWithEmbedding}`);

        // Count active posts with embeddings
        const activeWithEmbedding = await modelPost.countDocuments({
            status: 'active',
            embedding: { $exists: true, $ne: null, $ne: [] }
        });
        console.log(`   - Active với embedding: ${activeWithEmbedding}\n`);

        // Sample posts
        const samples = await modelPost.find().limit(5).select('_id title status embedding');
        console.log('📋 Sample posts:');
        samples.forEach((post, i) => {
            const hasEmb = post.embedding && post.embedding.length > 0;
            console.log(`   ${i + 1}. [${post.status.toUpperCase()}] ${post.title.substring(0, 40)}...`);
            console.log(`      Embedding: ${hasEmb ? `✅ (${post.embedding.length} dims)` : '❌ None'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPosts();
