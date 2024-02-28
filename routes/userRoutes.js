// --------------requirings
const express=require("express")
const session = require("express-session");
const flash = require("express-flash");
const userRoutes=express.Router()
const nocache = require("nocache");
const bodyparser=require("body-parser")

// Use express-session middleware
userRoutes.use(session({ 
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));

// Use express-flash middleware
userRoutes.use(flash());
// nocahca controle
userRoutes.use(nocache());
// -----------bodyparsing
userRoutes.use(bodyparser.json())
userRoutes.use(bodyparser.urlencoded({extended:true}))

// --------contoller
const userController=require("../controller/user_controller")
const cartController = require("../controller/cart_controller")
const checkOutController = require("../controller/checkOut")
const isAuth = require("../middleware/isAuth")
const profileController=require("../controller/profile_controller")


// ------------routes
userRoutes.get("/",userController.loadHome)
// userRoutes.get("/login",userController.loadLogin)
userRoutes.get("/login", (req, res, next) => {
    if (req.session.userId) {
        res.redirect("/");
    } else {
        next();
    }
}, userController.loadLogin);
userRoutes.post("/login",userController.verifylogin)
userRoutes.get("/register",userController.loadSignUp)
userRoutes.post("/register",userController.usersInsertDb)
// ------------logout
userRoutes.get("/logout",isAuth.isUserLogin,userController.userLogOut)
// Handle OTP verification
userRoutes.get("/verify-otp",userController.matchingOtp)
userRoutes.post("/verify-otp", userController.verifyOtp)
// shopCategory Routes
userRoutes.get("/loadShop",userController.loadShop)
userRoutes.get('/product/:id',userController.loadProductPage)
userRoutes.get('/cart',isAuth.isUserLogin,cartController.loadCart)
userRoutes.post('/addToCart',isAuth.isUserLogin, cartController.addToCart)
userRoutes.post('/change-product-quantity',cartController.quantityUpdate)
userRoutes.post('/deleteItems',cartController.deleteItems)
userRoutes.post("/delete-otp",userController.deleteotp)
userRoutes.post('/resend-otp',userController.resendOTP)
userRoutes.get("/checkOut",isAuth.isUserLogin,checkOutController.loadCheckOut)
userRoutes.post("/checkOut",isAuth.isUserLogin,checkOutController.postAddress)
userRoutes.post("/orderConfirmation",isAuth.isUserLogin,checkOutController.orderConfirmation)
userRoutes.get("/orderPlaced",isAuth.isUserLogin,checkOutController.loadPlaceOrder)
userRoutes.post("/verifyPayment",isAuth.isUserLogin,checkOutController.verifypayment)
userRoutes.get("/userProfile",isAuth.isUserLogin,profileController.loadUserProfile)
userRoutes.get("/orderDetails",isAuth.isUserLogin,profileController.loadOrderDetails)
userRoutes.get("/editUserProfile",isAuth.isUserLogin,profileController.loadEditUserProfile)
userRoutes.post("/editUserProfile",profileController.editUserProfile)
userRoutes.get("/viewProducts/:orderId",isAuth.isUserLogin,profileController.viewProducts)
userRoutes.post("/cancelOrder/:orderId",profileController.cancelOrder)
userRoutes.post("/returnOrder/:orderId",profileController.returnOrder)
userRoutes.post("/cancelReturn/:orderId", profileController.cancelReturn)
userRoutes.get("/addressManage",isAuth.isUserLogin,profileController.loadAddressManage)
userRoutes.post("/addressManage",profileController.postAddress)
userRoutes.delete("/deleteAddress/:addressId", profileController.deleteAddress)
userRoutes.get("/editAddress/:addressId",isAuth.isUserLogin,profileController.loadEditAddress)
userRoutes.post("/editAddress/:addressId",isAuth.isUserLogin,profileController.updateAddress)
userRoutes.post("/apply-coupon",checkOutController.applyCouupon)
userRoutes.get("/changePassword",isAuth.isUserLogin,profileController.loadChangePassword)
userRoutes.post("/changePassword",profileController.changePassword)
userRoutes.get("/wallet",isAuth.isUserLogin,profileController.loadWallet)
userRoutes.get('/search', userController.searchProducts);
userRoutes.get('/sort', userController.sort);
userRoutes.get("/invoice/:orderId",isAuth.isUserLogin,profileController.loadInvoice)
userRoutes.get("/forgetPass",userController.loadForgetPass)
userRoutes.post("/forgetPass",userController.forgetPass)
userRoutes.get("/verifyForget",userController.loadVerifyOtpForget)
userRoutes.post("/verifyForget",userController.verifyOtpForget)
userRoutes.get("/createNewPass",userController.loadCreateNewPass)
userRoutes.post("/createNewPass",userController.createNewPass)

module.exports=userRoutes
