const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
    },
    status: {
        type: String,   
        default: 'Active',
    },
    meetAmount: {
        type: Number,
        required: true
    },
    usedByUsers: [{
        user_id: {
            type: mongoose.Types.ObjectId,
            ref: 'UsersDatas'
        }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
