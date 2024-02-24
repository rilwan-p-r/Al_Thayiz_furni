const express=require("express")
const session = require("express-session");
const adminRoutes=express()
const nocache = require("nocache");
const path=require('path')
const upload = require("../middleware/multer")
const flash = require('connect-flash');

adminRoutes.use(session({ 
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));
adminRoutes.use(nocache());
adminRoutes.use(flash());

adminRoutes.use(express.static(path.join(__dirname,"..","asset"))) 
const adminController = require("../controller/admin_controller")
const isAuth = require("../middleware/isAuth")




// admin routes
adminRoutes.get("/admin_login", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache");
    next();
}, (req, res, next) => {
    if (req.session.isLogged) {
        res.redirect("/admin/adminPanel");
    } else {
        next();
    }
}, adminController.loadLogIn);
adminRoutes.post("/admin_login",adminController.verifyLogIn)
adminRoutes.get("/adminPanel", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache");
    next();
},isAuth.isAdminAuth, adminController.loadAdmin);
adminRoutes.get("/adminLogout",isAuth.isAdminAuth,adminController.adminLogout)
module.exports = adminRoutes
adminRoutes.get("/adminUsers",isAuth.isAdminAuth,adminController.loadUsers)
adminRoutes.get("/blockUser/:id",isAuth.isAdminAuth,adminController.blockuser)
adminRoutes.get("/addProduct",isAuth.isAdminAuth,adminController.loadAddProduct)
adminRoutes.post("/addProduct",upload.array('product_images',4),adminController.addProduct)
adminRoutes.get("/loadProductList",isAuth.isAdminAuth,adminController.loadProductList)
adminRoutes.post("/changeProductStatus/:productId",adminController.changeProductStatus)
adminRoutes.get("/listCategory",isAuth.isAdminAuth,adminController.listCategory)
adminRoutes.get("/addCategory",isAuth.isAdminAuth,adminController.loadCategory)
adminRoutes.post("/addCategory",adminController.insertCategory)
adminRoutes.get("/editCategory/:categoryId",isAuth.isAdminAuth, adminController.editCategory)
adminRoutes.post("/changeCategoryStatus/:categoryId",adminController.changeCategoryStatus)
adminRoutes.get('/editProduct',isAuth.isAdminAuth,adminController.loadEditProduct)
adminRoutes.delete('/deleteImage', isAuth.isAdminAuth, adminController.deleteImage);
adminRoutes.post('/editProduct',upload.array('product_images',4),adminController.postEditProduct)
adminRoutes.get("/orderlist",isAuth.isAdminAuth,adminController.loadOrdersList)
adminRoutes.get("/editOrderStatus/:orderId",isAuth.isAdminAuth,adminController.loadEditOrderStatus)
adminRoutes.post("/editOrderStatus/",adminController.editOrderStatus)
adminRoutes.get("/viewOrderedProducts/:orderId",adminController.loadViewOrderedProducts)
adminRoutes.post("/acceptReturn/:orderId",adminController.acceptReturn)
adminRoutes.post("/cancelReturn/:orderId",adminController.cancelReturn)
adminRoutes.get("/coupons",isAuth.isAdminAuth,adminController.loadCoupons)
adminRoutes.post("/coupons",adminController.addCoupon)
adminRoutes.get("/editCoupons/:id",isAuth.isAdminAuth,adminController.loadEditCoupons)
adminRoutes.post("/editCoupons/:id",adminController.editCoupons);
adminRoutes.get("/deleteCoupon/:id",adminController.deleteCoupon);
adminRoutes.get("/loadSalesreport",isAuth.isAdminAuth,adminController.loadSalesreport)
