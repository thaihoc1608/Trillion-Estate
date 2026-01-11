/**
 * Check Server Status & API Key
 */

require('dotenv').config();

console.log('🔍 Checking Server Configuration...\n');
console.log('='.repeat(80));

// 1. Check Environment Variables
console.log('\n📋 Environment Variables:');
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  - PORT: ${process.env.PORT || '3000'}`);
console.log(`  - CONNECT_DB: ${process.env.CONNECT_DB ? '✅ Set' : '❌ Not set'}`);

// 2. Check Google API Key
const apiKey = process.env.GOOGLE_API_KEY;
console.log('\n🔑 Google API Key:');
if (!apiKey) {
    console.log('  ❌ GOOGLE_API_KEY not found in .env file!');
    console.log('  → Please add: GOOGLE_API_KEY=your_key_here');
} else {
    console.log(`  ✅ GOOGLE_API_KEY exists`);
    console.log(`  📝 Length: ${apiKey.length} characters`);
    console.log(`  📝 Prefix: ${apiKey.substring(0, 10)}...`);

    // Test API Key
    console.log('\n🧪 Testing API Key...');
    testAPIKey(apiKey);
}

// 3. Check Vector Store Type
console.log('\n📦 Vector Store Config:');
console.log(`  - VECTOR_STORE_TYPE: ${process.env.VECTOR_STORE_TYPE || 'memory (default)'}`);

console.log('\n' + '='.repeat(80));

async function testAPIKey(apiKey) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        // Try to get model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Try a simple request
        const result = await model.generateContent('Say "hello"');
        const response = await result.response.text();

        console.log('  ✅ API Key is VALID!');
        console.log(`  ✅ Test response: "${response.substring(0, 50)}..."`);
    } catch (error) {
        console.log('  ❌ API Key is INVALID or has issues!');
        console.log(`  ❌ Error: ${error.message}`);

        if (error.message.includes('API key not valid')) {
            console.log('\n  🔧 FIX:');
            console.log('     1. Go to: https://aistudio.google.com/app/apikey');
            console.log('     2. Create a new API key');
            console.log('     3. Update .env with: GOOGLE_API_KEY=your_new_key');
        } else if (error.message.includes('quota')) {
            console.log('\n  🔧 FIX:');
            console.log('     1. API key quota exceeded');
            console.log('     2. Wait a few minutes and try again');
            console.log('     3. Or create a new API key');
        }
    }
}
