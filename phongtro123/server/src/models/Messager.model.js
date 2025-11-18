const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelMessager = new Schema(
    {
        senderId: { type: String, require: true, ref: 'user' },
        receiverId: { type: String, require: true, ref: 'user' },
        message: { type: String, require: true },
        status: { type: String, require: true },
        isRead: { type: Boolean, require: true, default: false },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('messager', modelMessager);
