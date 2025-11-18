const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelFavourite = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        postId: { type: String, require: true, ref: 'post' },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('favourite', modelFavourite);
