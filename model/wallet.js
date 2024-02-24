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
                return new Date(value).toLocaleDateString('en-US');
            }
        }        
    }]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
