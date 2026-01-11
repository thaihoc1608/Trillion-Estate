const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelPost = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: Array,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['phong-tro', 'nha-nguyen-can', 'can-ho-chung-cu', 'can-ho-mini'],
        },
        location: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        area: {
            type: Number,
            required: true,
        },
        options: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive'],
        },
        typeNews: {
            type: String,
            required: true,
            enum: ['vip', 'normal'],
        },
        endDate: {
            type: Date,
            required: true,
        },
        // 🆕 Vector Embedding fields cho Smart Chatbot
        embedding: {
            type: [Number], // Array of 768 dimensions (Gemini embedding size)
            required: false,
        },
        embeddingText: {
            type: String, // Text đã dùng để tạo embedding
            required: false,
        },
        embeddingUpdatedAt: {
            type: Date, // Timestamp khi embedding được tạo/update
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('posts', modelPost);
