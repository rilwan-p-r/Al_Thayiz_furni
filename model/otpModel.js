const mongoose = require("mongoose");
const schema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("otpDatas", schema);
