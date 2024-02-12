// category.js
const mongoose = require('mongoose');
const product = require("./product")

// Define the Category Schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    }
});

const category = mongoose.model('category',categorySchema );
module.exports = category;
