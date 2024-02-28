const usersDb=require("../model/users")
const Order = require("../model/ordersList")
const Product = require("../model/product")
const Wallet = require("../model/wallet")
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const util = require('util')
const readFile = util.promisify(fs.readFile); 

const loadUserProfile = async(req,res)=>{
    try{
        const userId = req.session.userId
        const user= await usersDb.findOne({_id:userId})
        res.render("userSide/userProfile",{user})
    }
    catch(error){
        console.log(error);
    }
}
const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await usersDb.findOne({ _id: userId });
        const ordersPerPage = 3;
        const page = parseInt(req.query.page) || 1;
        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / ordersPerPage);
        const orders = await Order.find({ userId: userId })
            .skip((page - 1) * ordersPerPage)
            .limit(ordersPerPage)
            .sort({ orderDate: -1 });

        res.render("userSide/orderDetails", { user, orders, currentPage: page, totalPages });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const loadEditUserProfile = async(req,res)=>{
    try{
        const userId = req.session.userId
        const user =await usersDb.findOne({_id:userId})
        res.render("userSide/editUserProfile",{user})
    }
    catch(error){
        console.log(error);
    }
}

const editUserProfile = async(req,res)=>{
    try{
        const userId = req.session.userId;
        const { name, mobile } = req.body;
        const updatedUser = await usersDb.findOneAndUpdate({ _id: userId },{ $set: { name, mobile } }, { new: true });
        console.log("fqrfqgfqrgq:",updatedUser);
        res.render("userSide/editUserProfile", { user: updatedUser });
        
    }
    catch(error){
        console.log(error);
    }
}

const viewProducts = async(req,res)=>{
    try{
        const userId = req.session.userId
        const user = await usersDb.findOne({_id:userId})
        const orderId = req.params.orderId;
        const orderDetails = await Order.findOne({ _id: orderId });
        res.render("userSide/viewProducts",{user, orderDetails})
    }
    catch(error){
        console.log(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      console.log("orderId:", orderId); // Log orderId to ensure it's correct
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.paymentMethod === 'RAZORPAY' || order.paymentMethod === 'Wallet') {
        console.log("Order payment method:", order.paymentMethod); // Log payment method to ensure it's correct
        
        const wallet = await Wallet.findOne({ user: order.userId });
        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found for the user' });
        }
  
        console.log("Wallet found:", wallet); // Log wallet details
        wallet.balance += order.totalAmount;
        wallet.transactions.push({
          orderId: orderId,
          type: 'credit',
          amount: order.totalAmount,
          date: new Date()
        });
  
        console.log("Updated wallet:", wallet); // Log updated wallet details
        await wallet.save();
      }
  
      for (const product of order.products) {
        await Product.updateOne(
          { _id: product.productId },
          { $inc: { quantity: product.quantity } }
        );
      }
  
      const result = await Order.deleteOne({ _id: orderId });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Order canceled successfully' });
      } else {
        res.status(500).json({ error: 'Failed to cancel order' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  const loadAddressManage = async(req,res)=>{
    try{
        const userId = req.session.userId
        user = await usersDb.findOne({_id:userId}).populate('addresses'); 
        res.render("userSide/manageAddress",{user})
    }
    catch(error){
        console.log(error);
    }
  }

  const postAddress = async (req, res) => {
    try {
        const { name, mobile, pincode, address, city, state, landmark, alternateMobile } = req.body;
        const userId = req.session.userId;

        // Validation
        if (!name || !mobile || !pincode || !address || !city || !state || !landmark || !alternateMobile) {
            throw new Error("All fields are required");
        }
        const trimmedFields = { name: name.trim(), mobile: mobile.trim(), pincode: pincode.trim(),
             address: address.trim(), city: city.trim(), state: state.trim(), landmark: landmark.trim(),
             alternateMobile: alternateMobile.trim() };

        // Validation for minimum length
        if (Object.values(trimmedFields).some(field => field.length < 2)) {
            throw new Error("All fields must have at least 2 characters");
        }
        if (trimmedFields.mobile === trimmedFields.alternateMobile) {
            throw new Error("Mobile and alternate mobile cannot be the same");
        }

        const newAddress = {
            name: trimmedFields.name,
            mobile: trimmedFields.mobile,
            pincode: trimmedFields.pincode,
            address: trimmedFields.address,
            city: trimmedFields.city,
            state: trimmedFields.state,
            landmark: trimmedFields.landmark,
            alternateMobile: trimmedFields.alternateMobile,
        };

        await usersDb.findByIdAndUpdate(userId, { $push: { addresses: newAddress } });
        res.json({ success: true, message: 'Address added successfully' });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};


const deleteAddress = async(req,res)=>{
    try {
        console.log("uhbvhcejhfbv:",req.params);
        const userId = req.session.userId;
        const addressId = req.params.addressId;
        const user = await usersDb.findById(userId);
        const addressIndex = user.addresses.findIndex(address => address._id.toString() === addressId);

        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }
        user.addresses.splice(addressIndex, 1);
        await user.save();
        res.status(200).json({ message: 'Address deleted successfully', user: user });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const loadEditAddress = async(req,res)=>{
    try{
        const userId = req.session.userId;
        const addressId = req.params.addressId;
        const user = await usersDb.findById(userId);
        const address = user.addresses.find(address => address._id.toString() === addressId);
        console.log("rfjnwpirhfn:",address);
        res.render("userSide/editAddress",{user,address})
    }
    catch(error){
        console.log(error);
    }
}

const updateAddress = async(req,res)=>{
    try{
        const userId = req.session.userId;
        const addressId = req.params.addressId;
        const user = await usersDb.findById(userId);
        console.log("hfhcseava",req.body);
        const { name, mobile, pincode, address, city, state, landmark, alternateMobile } = req.body;

        const addressToUpdate = user.addresses.id(addressId);
        addressToUpdate.name = name;
        addressToUpdate.mobile = mobile;
        addressToUpdate.pincode = pincode;
        addressToUpdate.address = address;
        addressToUpdate.city = city;
        addressToUpdate.state = state;
        addressToUpdate.landmark = landmark;
        addressToUpdate.alternateMobile = alternateMobile;

        // Save the updatations
        await user.save();
        res.redirect("/addressManage")
    }
    catch(error){
        console.log(error);
    }
}

const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Delivered' && !order.returnRequest) {
            order.status = 'Pending';
            order.returnRequest = true;
            await order.save();
            return res.status(200).json({ message: 'Return request submitted successfully' });
        } else if (order.status === 'Pending' && order.returnRequest) {
            order.status = 'Delivered';
            order.returnRequest = false;
            await order.save();
            return res.status(200).json({ message: 'Return request canceled successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid operation' });
        }
    } catch (error) {
        console.error('Error returning order:', error);
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

        if (order.status === 'Pending' && order.returnRequest) {
            order.status = 'Delivered';
            order.returnRequest = false;
            await order.save();
            return res.status(200).json({ message: 'Return request canceled successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid operation' });
        }
    } catch (error) {
        console.error('Error canceling return:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const loadChangePassword = async(req,res)=>{
    try{
        const userId = req.session.userId;
        const user = await usersDb.findById(userId);
        res.render("userSide/changePassword",{user})
    }
    catch(error){
        console.log(error);
    }
}

const changePassword = async(req,res)=>{
    try{
        const userId = req.session.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const user = await usersDb.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare provided current password with the stored password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Check if the new password meets your criteria
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "New password and confirm password do not match" });
        }

        // Update the password
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });

    }
    catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

const loadWallet = async(req,res)=>{
    try{
        const userId = req.session.userId
        const user = await usersDb.findById(userId);
        const wallet = await Wallet.findOne({ user: userId })
        res.render("userSide/wallet", { wallet,user });
    }
    catch(error){
        console.log(error);
    }
}

const loadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log("Order ID:", orderId);

        // Fetch order details from the database
        const orderDetails = await Order.findOne({ _id: orderId });
        console.log("Order Details:", orderDetails);

        // Check if orderDetails is null
        if (!orderDetails) {
            return res.status(404).send("Order not found");
        }

        // Render the EJS template with data
        const ejsTemplate = path.resolve(__dirname, '../views/userSide/invoice.ejs');
        const ejsData = await ejs.renderFile(ejsTemplate, { orderDetails });

        // Read CSS file content
        const cssContent = await readFile(path.resolve(__dirname, '../asset/css/invoice.css'), 'utf8');

        // Inject CSS into HTML template
        const htmlWithCss = ejsData.replace('</head>', `<style>${cssContent}</style></head>`);

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Wait for the page to load completely
        await page.goto('about:blank');
        await page.setContent(htmlWithCss, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // Set the content type and send the PDF as response
        res.contentType('application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    loadUserProfile,
    loadOrderDetails,
    loadEditUserProfile,
    editUserProfile,
    viewProducts,
    cancelOrder,
    loadAddressManage,
    postAddress,
    deleteAddress,
    loadEditAddress,
    updateAddress,
    returnOrder,
    cancelReturn,
    loadChangePassword,
    changePassword,
    loadWallet,
    loadInvoice
}