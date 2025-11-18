const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const keyWordSearch = new Schema(
    {
        title: { type: String, require: true },
        count: { type: Number, require: true, default: 0 },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('keyWordSearch', keyWordSearch);
