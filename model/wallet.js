const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [{
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        type: {
            type: String,
            enum: ['credit', 'debit'], // Add any other transaction types if needed
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now,
            get: function(value) {
                const date = new Date(value);
                const month = date.getMonth() + 1; // Months are zero-based, so add 1
                const day = date.getDate();
                const year = date.getFullYear();
                return `${month}/${day}/${year}`;
            }
        }
    }]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
