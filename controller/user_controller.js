const usersDb=require("../model/users")
const otpModel = require("../model/otpModel");
const Product = require("../model/product")
const Category = require("../model/category")
const cart = require("../model/cart")
const bcrypt=require("bcrypt")
const nodemailer = require('nodemailer');

// -----inputs conditions
const passwordValidator = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
const firstNameValidator = /^[A-Z][a-z]*$/;
const mobileNumberValidator = /^\d{10}$/;
// const emailValidator = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const emailValidator = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;


// otp sending========
const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "alarnoz39@gmail.com",
        pass: "zykx udai pasm kxir",
      },
    });

    const mailOptions = {
        from: "your-email@gmail.com",
        to: email,
        subject: "OTP for Registration",
        text: `Your OTP is ${otp}`,
      };
      await transporter.sendMail(mailOptions);
    };

// -----loadHome
const loadHome=async(req,res)=>{
  try{
   
    const userId=req.session.userId
    const user= await  usersDb.findOne({_id:userId})
    
    // console.log('userisjdkjkdj',user);
    res.render("userSide/home",{user})
  }
  catch(error){
    console.log(error);
  }
}

// -----loadLogIn
const loadLogin = async(req,res)=>{
  try{
    res.render("userSide/login")
  }
  catch(error){
    console.log(error);
  }
}

//loadSignUp-----------
const loadSignUp = async(req,res)=>{
  try{
res.render("userSide/signUp")
  }
  catch(error){
    console.log("error");
  }
}

//create new users-----------
const usersInsertDb=async(req,res)=>{
  try{
      console.log(req.body);
      let errorMessage = "";
      if (!passwordValidator.test(req.body.password)){
          errorMessage = "Password must be strong";
          // return res.render("register",{message:"password must be strong"})
      } // Return to prevent further execution
      if(!firstNameValidator.test(req.body.name.trim())){
          errorMessage = "Name must start with uppercase";
          // return res.render("register",{message:"Name must be start wirh uppercase"})
      }
      else if(!mobileNumberValidator.test(req.body.mobile.trim())){
          errorMessage = "Mobile number must be valid";
          // return res.render("register",{message:"Name must be start wirh uppercase"})
      }
      else if(!emailValidator.test(req.body.email)){
        errorMessage="enter valid email id"
          // return res.render("register",{message:"please enter email id properly"})
      }
      if (errorMessage.length>0) {
          req.flash("error", errorMessage);
          return res.redirect("/register");    
      }

      

      // const hashedpassword = bcrypt.hashSync(req.body.password, 10)
      const usersdata=new usersDb({
          name:req.body.name,
          email:req.body.email,
          mobile:req.body.mobile,
          password:req.body.password
      })
      console.log(usersdata);

      await usersdata.save()
      // Generate OTP
      // const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      // console.log(otp);
      // otp generating----
     
    const numericOtp = await generateNumericOtp(5);
    console.log(numericOtp);
      const hashedOtp = await bcrypt.hash(numericOtp, 10);
      console.log(hashedOtp);
       // Save the hashed OTP to the OTP collection
       const otpDatas = new otpModel({
          email: req.body.email,
          otp: hashedOtp,
      });
      await otpDatas.save();
      
      // Render a page to enter the OTP
      res.redirect(`/verify-otp?email=${req.body.email}`)
      // Send OTP via email
      await sendOtpEmail(req.body.email, numericOtp);
      console.log("page render to otp page");
  }
  catch(error){
      if (error.code === 11000) {
          console.error('Email must be unique:', error.message);
          req.flash("error", "Email must be unique");
          // Handle the error as needed
          res.redirect("/register")
        } else {
          console.error('Unexpected error:', error.message);
          req.flash("error", "Unexpected error occurred");
          // Handle other errors
        }
  }
}

function generateNumericOtp(length) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
  const randomIndex = Math.floor(Math.random() * digits.length);
  otp += digits[randomIndex];
    }
  return otp;
   }
// Verify OTP during the form submission
const verifyOtp = async (req, res) => {
    try {
        const enteredOtp = (req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4 + req.body.digit5).trim();
        console.log(enteredOtp);
      // Retrieve the hashed OTP from the OTP collection
      const otpDatas = await otpModel.findOne({ email: req.body.email })

      // Check if OTP data exists for the given email
      if (!otpDatas) {
        console.log("otp is not here server!!!");
        req.flash("error", "No OTP data found. Please request a new OTP.");
        return res.redirect("/verify-otp");
    }

     // Check if both enteredOtp and otpDatas.otp are valid
     if (!enteredOtp || !otpDatas.otp) {
        console.error("Invalid OTP data");
        req.flash("error", "Invalid OTP data. Please try again.");
        return res.redirect("/verify-otp");
      }

      // Ensure that both enteredOtp and otpDatas.otp are strings
      const enteredOtpString = String(enteredOtp);
      const hashedOtpString = String(otpDatas.otp);

      // Compare the entered OTP with the hashed OTP in the OTP collection
      const otpMatch = await bcrypt.compare(enteredOtpString, hashedOtpString);

      if (otpMatch) {
        // OTP is correct, mark the user as verified
        await usersDb.updateOne({ email: req.body.email }, { $set: { isVerified: true } });

        // Remove the OTP entry from the OTP collection
        await otpModel.deleteOne({ email: req.body.email });
    
            // Redirect to login or any other page
            return res.redirect("/login");

        } else {
            // Incorrect OTP, provide an error message
            req.flash("error", "Incorrect OTP. Please try again.");
            return res.redirect("/verify-otp"); // Redirect back to the OTP verification page
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
// matchingotp---------------
const matchingOtp = async(req,res)=>{
  try{
    const email= req.query.email
    res.render("userSide/otpverification",{email})
  }
  catch(error){
    console.log(error);
  }
}

// verifylogin---------------
const verifylogin = async(req,res)=>{
  try{
      let loginError=""
      const { email, password } = req.body;

      console.log('iambody',req.body);
  // Find the user by email
  const user = await usersDb.findOne({ email });
console.log('iamuser',user);
  // Check if the user exists
  if (!user) {
    loginError="invalid email id"  
}
if(loginError){
  req.flash("error", loginError);
 return res.redirect("/login")
}

// check user verified true or false

// Compare the entered password with the hashed password
const passwordMatch = await user.comparePassword(password);

console.log('paswordma',passwordMatch);
// Check if the password is correct
if (!passwordMatch) {

loginError="enter valid password"
}

if(loginError){
  req.flash("error", loginError);
 return res.redirect("/login")
}
if(!user.isVerified){
  loginError="account has not varified please enter otp"
}
if(loginError){
  req.flash("error",loginError)
  return res.redirect("/login")
}

if(passwordMatch){
req.session.userId=user._id
  //change the browser history
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("refresh", "0;url=/");

res.redirect("/");
}
  }
  catch(error){
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

// userLogout-------------------
const userLogOut = async(req,res)=>{
  try{
    req.session.destroy();
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.redirect("/")
  }
  catch(error){
    console.log("logouted not succesed");
  }
}
// loadShopsPage
const loadShop = async (req, res) => { 
  try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1;
      const perPage = 6;

      const selectedCategoryId = req.query.category || null;

      const selectedBrands = req.query.brands ? (Array.isArray(req.query.brands) ? req.query.brands : [req.query.brands]) : null;
      console.log("selectedBrands:", selectedBrands);

      const allCategories = await Category.find();

      const categoryProductCounts = await Promise.all(
          allCategories.map(async (category) => {
              const count = await Product.countDocuments({ category: category._id });
              return { categoryId: category._id, count };
          })
      );

      let query = {};
      if (selectedCategoryId) {
          query.category = selectedCategoryId;
      }
      if (selectedBrands) {
          // Modify query to filter by multiple brands using $in operator
          query.brand = { $in: selectedBrands };
      }

      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / perPage);

      const products = await Product.find(query)
          .populate("category")
          .skip((page - 1) * perPage)
          .limit(perPage);

      const brandsByCategory = {};
      for (const category of allCategories) {
          const brands = await Product.distinct("brand", { category: category._id });
          brandsByCategory[category._id] = brands;
      }

      const user = await usersDb.findOne({ _id: userId });

      res.render("userSide/shopsCategory", {
          user,
          products,
          currentPage: page,
          totalPages,
          allCategories,
          selectedCategoryId,
          selectedBrands,
          categoryProductCounts,
          brandsByCategory,
          message: products.length === 0 ? "No products found." : null,
      });
  } catch (error) {
      console.log("Error loading shops page:", error);
      res.status(500).send("Internal Server Error");
  }
};










// loadSingleProductPage
const loadProductPage = async (req, res) => {
  try {
    const userId=req.session.userId
    const user= await usersDb.findOne({_id:userId})
      const productId = req.params.id;

      // Fetch the product from the database based on the ID
      const products = await Product.findById(productId).populate({path:'category'})

      if (!products) {
          // Handle case where the product is not found
          return res.status(404).send('Product not found');
      }

      // Render your individual product page with the fetched product data
      res.render('userSide/productPage',{userId,user,products});
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
}

const resendOTP=async (req,res)=>{
  console.log('resend');
  try {
    console.log('resending otp');
    console.log(req.body.email);
    const numericOtp = await generateNumericOtp(5);
    console.log(numericOtp);
      const hashedOtp = await bcrypt.hash(numericOtp, 10);
      console.log(hashedOtp);
       // Save the hashed OTP to the OTP collection
       const otpDatas = new otpModel({
          email: req.body.email,
          otp: hashedOtp,
      });
      await otpDatas.save();
    await sendOtpEmail(req.body.email, numericOtp);
    console.log('resend success');
  } catch (error) {
    console.log('catch');
    console.log(error);
  }

}
const deleteotp = async (req, res) => {
  console.log('deleted otp');
  try {
      const email = req.body.email;
      console.log(email);
      // Delete the OTP document associated with the provided email
      await otpModel.deleteOne({ email });
      console.log('delete expired otp');
   
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

const searchProducts = async (req, res) => {
  try {
      const searchTerm = req.query.q; 
      const products = await Product.find({
          $or: [
              { name: { $regex: new RegExp(searchTerm, 'i') } },
          ]
      });
      if (products.length === 0) {
          return res.status(404).json({ message: 'No products found' });
      }

      return res.status(200).json({ products }); 
  } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

const sort = async (req, res) => {
  try {
      const minPrice = parseInt(req.query.minPrice); // Convert to integer
      const maxPrice = parseInt(req.query.maxPrice); // Convert to integer

      console.log("Min Price:", minPrice);
      console.log("Max Price:", maxPrice);

      const filteredProducts = await Product.find({
          price: { $gte: minPrice, $lte: maxPrice } 
      }).sort({ price: -1 });

      console.log("Filtered Products:", filteredProducts);

      return res.status(200).json({ filteredProducts });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const loadForgetPass = async(req,res)=>{
  try{
    res.render("userSide/forgetPass")
  }
  catch(error){
    console.log(error);
  }
}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alarnoz39@gmail.com',
    pass: 'zykx udai pasm kxir' 
    }
});
const sendOTPByEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`
    });

    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


const forgetPass = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("eeeeeeeeeeeeeeeee", { email });
    let otpRecord = await otpModel.findOne({ email: req.body.email }); // Change const to let
    // Proceed with generating OTP and sending email
    
    let otpValue; // Define otpValue here

    // If an OTP document exists
    if (otpRecord) {
      otpValue = Math.floor(100000 + Math.random() * 900000);
      const hashedOTP = await bcrypt.hash(otpValue.toString(), 10);
      otpRecord.otp = hashedOTP;
      await otpRecord.save();
    } else {
      // Generate a new OTP and save
      otpValue = Math.floor(100000 + Math.random() * 900000);
      const hashedOTP = await bcrypt.hash(otpValue.toString(), 10);
      otpRecord = new otpModel({
        email: email,
        otp: hashedOTP
      });
      await otpRecord.save();
    }
    res.redirect(`/verifyForget?email=${req.body.email}`);

    // Send OTP to the user's email
    await sendOTPByEmail(email, otpValue);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const loadVerifyOtpForget = async(req,res)=>{
  try{
    const email= req.query.email
    res.render("userSide/otp",{email})
  }
  catch(error){
    console.log(error);
  }
}

const verifyOtpForget = async (req, res) => {
  try {
      const user = req.body.email;
      const enteredOtp = req.body.otp;
      const otpDatas = await otpModel.findOne({ email: req.body.email });

      if (!otpDatas) {
          return res.status(400).json({ error: 'OTP not found' });
      }
      const isMatch = await bcrypt.compare(enteredOtp.toString(), otpDatas.otp);
      if (!isMatch) {
          return res.status(400).json({ error: 'Invalid OTP' });
      }

      await otpModel.deleteOne({ email: user });
      return res.status(200).json({ success: true, email: user });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};

const loadCreateNewPass = async(req,res)=>{
  try{
    const { email } = req.query;
    res.render("userSide/createNewPass", { email });
  }
  catch(error){
    console.log(error);
  }
}

const createNewPass = async(req,res)=>{
  try{
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const email = req.body.email
    console.log('change pass::::',email);
    const user = await usersDb.findOne({ email: email });
    console.log("userrrrrrrrrrrrrr",user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
  }
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
res.redirect("/login");

  }
  catch(error){
    console.log(error);
    res.status(400).json({ error: error.message });
  }
}

// exportssss--------------------
module.exports={
  usersInsertDb,
  verifylogin,
  verifyOtp,
  loadHome,
  matchingOtp,
  loadSignUp,
  loadLogin,
  userLogOut,
  loadShop,
  loadProductPage,
  resendOTP,
  deleteotp,
  searchProducts,
  sort,
  loadForgetPass,
  forgetPass,
  loadVerifyOtpForget,
  verifyOtpForget,
  loadCreateNewPass,
  createNewPass
  }

