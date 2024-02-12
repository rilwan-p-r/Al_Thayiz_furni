const mongoose=require("mongoose")
const bcrypt=require("bcrypt")
const schema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        default: false

    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    addresses: [
        // Define the structure of your address object here
        {
            name: String,
            mobile: String,
            pincode: String,
            address: String,
            city: String,
            state: String,
            landmark: String,
            alternateMobile: String,
        },
    ],
})

schema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('Invalid login credentials');
    }
    return user;
};

const User = mongoose.model('UsersDatas', schema);
module.exports = User;
// module.exports=mongoose.model("usersDatas",schema)
