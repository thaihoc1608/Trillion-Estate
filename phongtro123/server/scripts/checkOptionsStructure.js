/**
 * Check Options Structure in Database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelPost = require('../src/models/post.model');

async function checkOptionsStructure() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Connected to MongoDB\n');

        const posts = await modelPost.find({ status: 'active' }).limit(5);

        console.log(`📊 Checking first ${posts.length} posts...\n`);
        console.log('='.repeat(80));

        for (const post of posts) {
            console.log(`\n📍 Post: ${post.title.substring(0, 60)}`);
            console.log(`   ID: ${post._id}`);

            // ✨ CHECK OPTIONS STRUCTURE
            if (post.options) {
                console.log(`\n   📦 OPTIONS Type: ${Array.isArray(post.options) ? 'ARRAY ✅' : 'OBJECT'}`);
                console.log(`   📦 OPTIONS Value:`);
                console.log(JSON.stringify(post.options, null, 4));
            } else {
                console.log('\n   ⚠️  NO OPTIONS');
            }

            console.log('\n' + '-'.repeat(80));
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkOptionsStructure();
