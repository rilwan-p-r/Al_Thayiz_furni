    const usersDb = require("../model/users")
    const category = require("../model/category")
    const Product = require("../model/product")
    const Order = require("../model/ordersList")
    const Coupon = require("../model/coupon")
    const Wallet = require("../model/wallet")
    const sharp = require("sharp")
    const path=  require('path')
      // loadAdminLogIn-------
    const loadLogIn = async(req,res)=>{
        try{
            if (req.session.isLogged) {
            res.redirect("/admin/adminPanel");
        } else {
            res.render("adminSide/adminLogIn")
        }
        }
        catch(error){
            console.log(error);
        }
    }

    // verifying the admin
    const verifyLogIn = async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await usersDb.findByCredentials(email, password);

            if (user && user.isAdmin) {
                req.session.isLogged = true;
                req.session.adminEmail = email;

                // Change the browser history
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
                res.setHeader("refresh", "0;url=/");

                res.redirect("/admin/adminPanel");
            } else {
                let  errorMessage=[]
                req.flash('error', 'Invalid email or password');
                req.session.isLogged = false;
                res.redirect("/admin/admin_login");
                console.log("There is some login verifying problem");
            }
        } catch (error) {
            // Catch the error when login credentials are invalid
            req.flash('error', 'Invalid email or password');
            req.session.isLogged = false;
            res.redirect("/admin/admin_login");
            console.log(error);
        }
    };

    // loadDashBoard-------
    const loadAdmin = async(req,res)=>{
        try{
            if(req.session.isLogged){
                res.render("adminSide/adminPanel")
            }
            else{
                res.redirect("/admin/admin_login")
            }
            
        }
        catch(error){
    console.log(error);
        }
    }

    // admin logout module--------
    const adminLogout = async(req,res)=>{
        try{
            req.session.destroy();
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        console.log("adminLoggedout");
        res.redirect("/admin/admin_login")
    }
        
        catch(error){
            console.log(error);
        }
    }

    // loadUsersPage----------
    const loadUsers = async(req,res)=>{
    try{
        if(req.session.isLogged){
            const users = await usersDb.find()
            console.log(users);
            res.render("adminSide/users", { users: users });
        }
        else{
            res.redirect("/admin/admin_login")
        }
    
    }
    catch(error){
        console.log(error);
    }
        
    }
    // Block or unblock user function
    const blockuser= async (req,res)=>{

        try{
        const userId = req.params.id
        console.log(userId);
        const blockuser = await usersDb.findById(userId)
        if(blockuser){
        blockuser.isBlocked= !blockuser.isBlocked
            const updateduser = await blockuser.save()
        console.log(updateduser);
            if(updateduser){
            res.redirect("/admin/adminUsers")
            }else{
            res.status(500).send("Failed to update user");
            }
        }else{
            res.status(404).send("user not found");
        }
        }catch(error){
    console.log(error);
        res.status(500).send("Internal Server Error")
        }
    }
//    products-----------||||||
    const loadAddProduct = async(req,res)=>{
        try{
            if (req.session.isLogged) {
                const users = await usersDb.find()
                const categories = await category.find();
                res.render("adminSide/addProduct", { users: users, editMode: false ,categories});
            } else {
                res.redirect("/admin/admin_login");
            }
    }
    catch(error){
        console.log(error);
        res.redirect("/admin/admin_login");
    }
}   

const addProduct = async (req, res) => {
    try {
        const productId = req.params?.productId;
        const { product_name, description, price, quantity, editMode, category: categoryId } = req.body;

        if (req.session.isLogged) {
            const categories = await category.find();

            if (editMode === 'true') {
                // Update existing product
                await Product.findByIdAndUpdate(productId, { product_name, description, price, quantity });
            } else {
                let productImages = [];

                for (let i = 0; i < req.files.length; i++) {
                    const uploadedImagePath = req.files[i].path;
                    const uniqueIdentifier = Date.now()+ '_' + Math.floor(Math.random() * 1000); // Use a unique identifier for each image
                    const resizedImagePath = path.join(__dirname, '..', 'asset', 'uploads', 'resized', `${uniqueIdentifier}_${req.files[i].filename}`);

                    // Resize the image using sharp
                    await sharp(uploadedImagePath)
                        .resize(840, 840, { fit: 'fill' })
                        .toFile(resizedImagePath);
                    productImages.push(`${uniqueIdentifier}_${req.files[i].filename}`);
                }
                const selectedCategory = await category.findById(categoryId);
                const categoryName = selectedCategory.name;

                const newProduct = new Product({
                    name: product_name,
                    description,
                    price,
                    quantity,
                    category: categoryId,
                    categoryName: categoryName,
                    productImages: productImages,
                });

                await newProduct.save();
            }
            res.redirect("/admin/loadProductList");
        } else {
            res.redirect("/admin/admin_login");
        }
    } catch (error) {
        console.log(error);
        res.redirect("/admin/loadProductList");
    }
};

    const changeProductStatus = async(req,res)=>{
        const productId = req.params.productId;
        try{
            const productStat = await Product.findById(productId);
            if (productStat) {
                productStat.status = !productStat.status; // Toggle the status
                await productStat.save();
                res.redirect('/admin/loadProductList');
            } else {
                res.status(404).send('Category not found');
            }
        }
        catch(error){
            console.log(error)
            res.json({ success: false, message: 'Internal server error' });
        }
    }
     const loadProductList = async(req,res)=>{
        try{
            if (req.session.isLogged) {
                // Fetch products or use your own logic to get products
                const products = await Product.find().populate('category');

                console.log('pros',products);
                const categorys = await category.find()
                res.render("adminSide/productsList", { products,categorys });
            } else {
                res.redirect("/admin/admin_login");
            }
        
        }
        catch(error){
            console.log(error);
        }
    }
    const loadEditProduct = async(req,res)=>{
        try{
            const productId = req.query.id;
            console.log('proid',productId);
            const categories = await category.find();
            // Find the category by ID
            const productItem = await Product.findById(productId);
            res.render("adminSide/editProduct", { product: productItem ,categories});
        }
        catch(error){
            console.log(error);
        }
    }

    // In your adminController
const deleteImage = async (req, res) => {
    try {
        const imagePath = req.query.imagePath;
        const product = await Product.findOneAndUpdate(
            { productImages: imagePath },
            { $pull: { productImages: imagePath } },
            { new: true }
        )
        if (!product) {
            return res.json({ success: false, message: 'Image not found in the database' });
        }
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Failed to delete image' });
    }
}


    const postEditProduct=async(req,res)=>{
    try {


        console.log('adshgdhgdjgkd',req.body);
        const { product_name, description, price, quantity, category,productId } = req.body;
        console.log('akska',productId);

        console.log(req.files);
        let productImages=[]

        const existingProduct = await Product.findById(productId);
        if (existingProduct.productImages && existingProduct.productImages.length > 0) {
            productImages = existingProduct.productImages
        }

        for (let i = 0; i < req.files.length; i++) {
            const uploadedImagePath = req.files[i].path;
            const resizedImagePath = path.join(__dirname, '..', 'asset', 'uploads', 'resized', req.files[i].filename);

            // Resize the image using sharp
            await sharp(uploadedImagePath)
                .resize(840, 840, { fit: 'fill' })
                .toFile(resizedImagePath);

            // Save the resized image path
            productImages.push(req.files[i].filename)
        }

     const proData =  await  Product.updateOne({_id:productId},{$set:{name:product_name,description:description,price:price,quantity:quantity,category:category,productImages:productImages}})
       
     if(proData){
        res.redirect('/admin/loadProductList')
     }


    } catch (error) {
        console.log(error.message)
    }
    }
//  products end-------!!!!

// category-----||||
    const listCategory = async(req,res)=>{
        try{
            if (req.session.isLogged) {
                const categories = await category.find();
                res.render("adminSide/listCategory", { categories });
            } else {
                res.redirect("/admin/admin_login");
            }
        }
        catch(error){
            console.log(error);
        }
    }
    const loadCategory = async(req,res)=>{
        try{
            if(req.session.isLogged){
                const users = await usersDb.find()
                console.log(users);
                res.render("adminSide/addCategory", { users: users, editMode: false });
            }
            else{
                res.redirect("/admin/admin_login")
            }
        }
        catch(error){
            console.log(error);
        }
    }

    const insertCategory = async (req, res) => {
        try {
            if (req.session.isLogged) {
                const { name, description, editMode, categoryId } = req.body;
    
                if (editMode === 'true') {
                    await category.findByIdAndUpdate(categoryId, { name, description });
                    req.flash('success', 'Category updated successfully.');
                    res.redirect("/admin/listCategory");
                } else {
                    try {
                        const existingCategory = await category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
                        if (existingCategory) {
                            req.flash('error', 'A category with this name already exists. Please choose a different name.');
                            res.redirect("/admin/addCategory");
                        } else {
                            const newCategory = new category({
                                name,
                                description,
                            });
                            await newCategory.save();
                            req.flash('success', 'Category created successfully.');
                            res.redirect("/admin/listCategory");
                        }
                    } catch (error) {
                        // Handle other errors
                        console.log(error);
                        req.flash('error', 'An unexpected error occurred.');
                        res.redirect("/admin/addCategory");
                    }
                }
            } else {
                req.flash('error', 'User is not logged in.');
                res.redirect("/admin/admin_login");
            }
        } catch (error) {
            console.log(error);
            req.flash('error', 'An unexpected error occurred.');
            res.redirect("/admin/addCategory");
        }
    };
    
    
      

    const editCategory = async(req,res)=>{
        try{
            const categoryId = req.params.categoryId;
            const categoryItem = await category.findById(categoryId);
            res.render("adminSide/addCategory", { category: categoryItem, editMode: true });
        }
        catch(error){
            console.log(error);
        }
    }
    const changeCategoryStatus = async(req,res)=>{
        const categoryId = req.params.categoryId;
        try{
            const categoryStat = await category.findById(categoryId);
            if (categoryStat) {
                categoryStat.status = !categoryStat.status; // Toggle the status
                await categoryStat.save();
                res.redirect('/admin/listCategory');
            } else {
                res.status(404).send('Category not found');
            }
        }
        catch(error){
            console.log(error)
            res.json({ success: false, message: 'Internal server error' });
        }
    }

    const loadOrdersList = async(req,res)=>{
        try{
            if(req.session.isLogged){
                const orderDetails = await Order.find()
                res.render("adminSide/orderList",{orderDetails})
            }
            else{
                res.redirect("/admin/admin_login")
            }
        }
        catch(error){
            console.log(error);
        }
    }

    const loadEditOrderStatus = async(req,res)=>{
        try{

           if(req.session.isLogged){
            const orderId = req.params.orderId;
            const orderDetails = await Order.findOne({ _id: orderId });
            res.render("adminSide/editOrderStatus",{orderDetails,orderId})
            }
            else{
                res.redirect("/admin/admin_login")
            }
        }
        catch(error){
            console.log(error);
        }
    }

    const editOrderStatus = async(req,res)=>{
        try{

            console.log('jdssssssssssssssssssssssssssssssssssssssssssssssss')
            const orderId = req.body.orderId;
            console.log("wvfgvv:",orderId);
            const newStatus = req.body.newStatus;
            
            const updatedOrder = await Order.findOneAndUpdate( { _id: orderId },{ $set: { status: newStatus } },{ new: true });
            console.log("favbafbvavafd:",updatedOrder);
            res.redirect("/admin/orderList");
        }
        catch(error){
            console.log(error);
        }
    }

    const loadViewOrderedProducts = async(req,res)=>{
        try{
            if(req.session.isLogged){
                const orderId = req.params.orderId;
                const orderDetails = await Order.findOne({ _id: orderId });
                res.render("adminSide/viewOrderedProducts",{orderDetails})
                }
                else{
                    res.redirect("/admin/admin_login")
                }

        }
        catch(error){
            console.log(error);
        }
    }

    const acceptReturn = async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
    
            if (order.status === 'Pending') {
                order.status = 'Returned';
                await order.save();
                let wallet = await Wallet.findOne({ user: order. userId });
                if (!wallet) {
                    wallet = new Wallet({
                        user: order.user,
                        balance: order.totalAmount,
                        transactions: [{
                            orderId: order._id,
                            type: 'credit',
                            amount: order.totalAmount,
                            date: new Date()
                        }]
                    });
                } else {
                    wallet.balance += order.totalAmount;
                    wallet.transactions.push({
                        orderId: order._id,
                        type: 'credit',
                        amount: order.totalAmount,
                        date: new Date()
                    });
                }
        
                await wallet.save();
    
                return res.status(200).json({ message: 'Return request accepted successfully' });
            } else {
                return res.status(400).json({ message: 'Invalid operation' });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    const cancelReturn = async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findById(orderId);
    
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
    
            if (order.status === 'Pending') {
                // Cancel return request if it's already submitted
                order.status = 'Delivered';
                order.returnRequest = false; // Reset returnRequest to false
                await order.save();
                
                return res.status(200).json({ message: 'Return request canceled successfully' });
            } else {
                return res.status(400).json({ message: 'Invalid operation' });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    const loadCoupons = async(req,res)=>{
        try{
            if(req.session.isLogged){
                const coupons = await Coupon.find()
                res.render("adminSide/coupons", { coupons: coupons });
            }
            else{
                res.redirect("/admin/admin_login")
            }
        }
        catch(error){
            console.log(error);
        }
    }

    const addCoupon = async (req, res) => {
        try {
            if (req.session.isLogged) {
                const { title, code, discount, description, expiryDate } = req.body;
    
                // Validate coupon code
                if (!isValidCouponCode(code)) {
                    return res.status(400).json({ message: "Coupon code must have at least three characters and contain at least one number." });
                }
    
                const newCoupon = new Coupon({
                    title,
                    code,
                    discount,
                    description,
                    expiryDate
                });
    
                await newCoupon.save();
                return res.redirect(req.originalUrl);
            } else {
                return res.status(401).json({ message: "Unauthorized" });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    function isValidCouponCode(code) {
        return code.length >= 3 && /\d/.test(code);
    }
    
    const loadEditCoupons = async (req, res) => {
        try {
            const couponId = req.params.id;
            const coupon = await Coupon.findOne({ _id: couponId });
            if (coupon) {
                res.render('adminSide/editCoupon', { coupon });
            } else {
                res.status(404).send('Coupon not found');
            }
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }

    const   editCoupons = async(req,res)=>{
        try{
            const couponId = req.params.id;
        const { title, code, discount, description, expiryDate } = req.body;
         const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            { title, code, discount, description, expiryDate },
            { new: true }
        );

        if (updatedCoupon) {
            res.redirect('/admin/coupons')
        } else {
            res.status(404).send('Coupon not found');
        }
        }
        catch(error){
            console.log(error);
        }
    }

    const deleteCoupon  = async(req,res)=>{
        try{
            const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!deletedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.redirect("/admin/coupons")
        console.log("coupons has deleted successfully");
        }
        catch(error){
            console.log(error);
        }
    }


    
    
    module.exports={loadAdmin,
        loadLogIn,
        verifyLogIn,
        adminLogout,
        loadUsers,
        blockuser,
        loadProductList,
        loadAddProduct,
        addProduct,
        listCategory,
        loadCategory,
        insertCategory,
        editCategory,
        changeCategoryStatus,
        changeProductStatus,
        loadEditProduct,
        postEditProduct,
        loadOrdersList,
        loadEditOrderStatus,
        editOrderStatus,
        loadViewOrderedProducts,
        deleteImage,
        acceptReturn,
        cancelReturn,
        loadCoupons,
        addCoupon,
        loadEditCoupons,
        editCoupons,
        deleteCoupon
    }