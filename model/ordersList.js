const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            productName: {
                type: String, // Assuming the product name is a string
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            productImages: [
                {
                    type: String,
                    required:true
                }
            ],
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        type: {
            name: String,
            mobile: String,
            pincode: String,
            address: String,
            city: String,
            state: String,
            landmark: String,
            alternateMobile: String,
        },
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Processing', 'Out of delivery', 'Delivered','Pending','Returned'],
        default: 'Processing',
    },
        returnRequest: {
        type: Boolean,
        default: false
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
