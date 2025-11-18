const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelRechargeUser = new Schema(
    {
        userId: { type: String, require: true, ref: 'user' },
        amount: { type: Number, require: true },
        typePayment: { type: String, require: true },
        status: { type: String, require: true },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('rechargeuser', modelRechargeUser);
