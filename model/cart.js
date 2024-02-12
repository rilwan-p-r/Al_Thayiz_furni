// models/cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
  },
  items: [{
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    quantity: {
        type: Number,
        default:1
    },

    price: {
        type:Number,
        required:true
    },

    total_price: {
        type:Number,
        required:true
    },

    status: {
        type:String,
        default:"placed"    
    },

    cancellationReason:{
        type:String,
        default:"none"
    }
}],
});

const cart = mongoose.model('Cart', cartSchema);
module.exports = cart;
