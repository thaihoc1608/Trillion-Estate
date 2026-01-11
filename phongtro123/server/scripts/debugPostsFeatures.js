/**
 * Debug Script - Check Posts Options & Embeddings
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelPost = require('../src/models/post.model');

async function debugPostsFeatures() {
    try {
        await mongoose.connect(process.env.CONNECT_DB);
        console.log('✅ Connected to MongoDB\n');

        const posts = await modelPost.find({ status: 'active' });

        console.log(`📊 Total active posts: ${posts.length}\n`);
        console.log('='.repeat(80));

        for (const post of posts) {
            console.log(`\n📍 Post: ${post.title.substring(0, 60)}`);
            console.log(`   ID: ${post._id}`);
            console.log(`   Location: ${post.location}`);
            console.log(`   Price: ${(post.price / 1000000).toFixed(1)} triệu`);

            // Check embedding
            const hasEmbedding = post.embedding && Array.isArray(post.embedding) && post.embedding.length > 0;
            console.log(`   Embedding: ${hasEmbedding ? '✅ YES (' + post.embedding.length + ' dims)' : '❌ NO'}`);

            if (post.embeddingText) {
                console.log(`   Embedding Text Preview: "${post.embeddingText.substring(0, 100)}..."`);
            }

            // ✨ Check OPTIONS (features)
            if (post.options) {
                console.log('\n   🌟 FEATURES:');

                const features = [
                    { key: 'airConditioner', label: 'Điều hòa' },
                    { key: 'heater', label: 'Nóng lạnh' },
                    { key: 'wifi', label: 'WiFi' },
                    { key: 'washingMachine', label: '🔍 MÁY GIẶT' },
                    { key: 'freeTime', label: 'Giờ giấc tự do' },
                    { key: 'elevator', label: 'Thang máy' },
                    { key: 'kitchen', label: 'Kệ bếp' },
                    { key: 'privateOwner', label: 'Không chung chủ' },
                    { key: 'security', label: 'Bảo vệ 24/24' },
                    { key: 'fridge', label: 'Tủ lạnh' },
                    { key: 'parking', label: 'Hầm để xe' },
                    { key: 'balcony', label: 'Ban công' },
                ];

                let hasFeatures = false;
                for (const feature of features) {
                    if (post.options[feature.key]) {
                        console.log(`      ✓ ${feature.label}`);
                        hasFeatures = true;
                    }
                }

                if (!hasFeatures) {
                    console.log('      ⚠️  NO FEATURES ENABLED');
                }
            } else {
                console.log('\n   ⚠️  NO OPTIONS OBJECT');
            }

            console.log('\n' + '-'.repeat(80));
        }

        // Summary
        const postsWithWashingMachine = posts.filter(p => p.options?.washingMachine);
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Posts with WASHING MACHINE: ${postsWithWashingMachine.length}/${posts.length}`);

        if (postsWithWashingMachine.length === 0) {
            console.log('\n⚠️  PROBLEM FOUND: KHÔNG CÓ POST NÀO CÓ MÁY GIẶT!');
            console.log('   → Cần thêm options.washingMachine: true vào posts trong database');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugPostsFeatures();
