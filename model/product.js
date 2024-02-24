        const mongoose = require('mongoose');

        const productSchema = new mongoose.Schema({
            name: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'category',
                required: true,
            },
            brand:{
                type: String,
                required:true,
            },
            categoryName: {
                type: String,
            },
            productImages: [
                {
                    type: String,
                    required:true
                }
            ],
            status: {
                type: Boolean,
                default: true,
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        });

        const product = mongoose.model('Product', productSchema);

        module.exports = product;
