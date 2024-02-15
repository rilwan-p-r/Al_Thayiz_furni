const usersDb = require("../model/users");
const Cart = require("../model/cart");
const Order = require("../model/ordersList")
const Product = require("../model/product")
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Coupon = require("../model/coupon")

var instance = new Razorpay({
  key_id: "rzp_test_8UFoOV8AuZ0XKu",
  key_secret: "Z2X6UflP4aZyN729TbN8DUvZ",
});
// Function to generate HMAC-SHA256
function hmac_sha256(data, key) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("hex");
}

const loadCheckOut = async(req,res)=>{
    try {
        let user;
        if(req.session.userId){
            const userId = req.session.userId
            user = await usersDb.findOne({_id:userId}).populate('addresses'); // Assuming the array of addresses
        }
        if(user){
            
            const cartDetails = await Cart.findOne({ userId: user._id }).populate('items.product_id');
            const coupons = await Coupon.find({ status: "Active" });

            res.render("userSide/checkOut", { user, cartDetails,coupons });
        }
    } catch (error) {
        console.log(error);
        res.redirect("/login")
    }
}

const postAddress = async (req, res) => {
    try {
        const { name, mobile, pincode, address, city, state, landmark, alternateMobile } = req.body;
        const userId = req.session.userId;
        
        // Check if any of the required fields contain only spaces
        if (Object.values(req.body).some(value => typeof value === 'string' && value.trim() === '')) {
          return res.json({ success: false, message: 'Please fill out all fields properly' });
      }
        const newAddress = {
            name,
            mobile,
            pincode,
            address,
            city,
            state,
            landmark,
            alternateMobile,
        };
        await usersDb.findByIdAndUpdate(userId, { $push: { addresses: newAddress } });
        res.json({ success: true, message: 'Address added successfully' });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: 'Error adding address' });
    }
};

const orderConfirmation = async (req, res) => {
  try {
    const payMethod = req.body.paymentMethod;

    console.log("Order Confirmation Process Started");
    const userId = req.session.userId;
    const user = await usersDb.findById(userId);

    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
    const selectedAddressId = req.body.selectedAddress;
console.log("ffffffffffffffffffffffffffffffff");


    const selectedAddressObject = user.addresses.find(
      (address) => address._id.toString() === selectedAddressId
    );

    console.log("ppppppppppppppppppppppppppppppp");

    if (!selectedAddressObject) {
      console.log("Selected address not found for the user");
      return res.status(400).json({ error: "Selected address not found" });
    }
    console.log("Selected Address:", selectedAddressObject);
    const cart = await Cart.findOne({ userId }).populate("items.product_id");

    if (!cart) {
      console.log("Cart not found for the user");
      return res.status(400).json({ error: "Cart not found" });
    }
    // Parse totalAmount as a number
    const totalAmount = parseFloat(req.body.totalAmount.replace('₹', ''));
    const discountAmount = parseFloat(req.body.discountAmount.replace('₹', ''));


    const newOrder = {
      userId: userId,
      products: [],
      totalAmount: totalAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod: payMethod || "",
      shippingAddress: selectedAddressObject,
    
    };
    console.log("req.body.paymentMethod", typeof payMethod);
    for (const item of cart.items) {
      const product = item.product_id;

      // Check if the product is available
      if (product.quantity < item.quantity) {
        console.log(
          `Insufficient quantity available for product: ${product.name}`
        );
        return res
          .status(400)
          .json(`{
            error: Insufficient quantity available for product: ${product.name},
          }`);
      }

      // Update the available quantity
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, quantity: { $gte: item.quantity } }, // Ensure available quantity is sufficient
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // If updatedProduct is null
        console.log(
          `Insufficient quantity available for product: ${product.name}`
        );
        return res
          .status(400)
          .json(`{
            error: Insufficient quantity available for product: ${product.name},
          }`);
      }

      newOrder.products.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        productImages: product.productImages,
      });
    }

    const order = await Order.create(newOrder);

    // Clean up cart
    await Cart.findOneAndDelete({ userId });

    console.log("Order created:", order._id);
    if (payMethod == "Cod") {
   
      res.status(201).json({ codSuccess: true, order });
    } else {
      // Parse totalAmount as a number and remove currency symbol if present
       const totalAmount = parseFloat(req.body.totalAmount.replace('₹', ''));

      console.log("razorpay working", order._id, "", totalAmount);
      const razorpayOrder = await genarateRazorpay(
      order._id,
      totalAmount
  );
      // console.log("Razorpay order generated successfully", razorpayOrder);
      res.json({ razorpayOrder });
    }
  } catch (error) {
    console.error("Error during order confirmation:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const genarateRazorpay = async (orderId, subTotal) => {
  try {
    const options = {
      amount: subTotal*100,
      currency: "INR",
      receipt: orderId.toString(),
    };

    const order = await instance.orders.create(options);
    // console.log("Razorpay order created:", order);
    return order;
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    // Handle errors appropriately, e.g., render an error page
  }
};

const verifypayment = async (req, res) => {
  try {
    console.log("body::", req.body);
    const razorpay_payment_id = req.body.payment.razorpay_payment_id;
    const razorpay_order_id = req.body.payment.razorpay_order_id;
    const razorpay_signature = req.body.payment.razorpay_signature;
    const receiptID = req.body.order.receipt;

    console.log("razorpay_payment_id:", razorpay_payment_id);
    console.log("razorpay_order_id:", razorpay_order_id);
    console.log("razorpay_signature:", razorpay_signature);
    console.log("recieptID:", receiptID);

    generated_signature = hmac_sha256(
      razorpay_order_id + "|" + razorpay_payment_id,
      "Z2X6UflP4aZyN729TbN8DUvZ"
    );

    if (generated_signature == razorpay_signature) {
      console.log("payment is successful");
      const update = await Order.updateOne(
        { _id: receiptID },
        { $set: { status: "placed", payment: "razorpay" } }
      );
      console.log("status changed");
    }
    res.json({ razorpaySuccess: true, });
  } catch (error) {
    console.log(error);
}
};

const applyCouupon = async(req,res)=>{
  const couponCode = req.body.couponCode;
  const userId = req.session.userId;
  try{ 
    
    // Check if the coupon code exists and is not already used by the user
    const coupon = await Coupon.findOne({ code: couponCode });
    console.log('Coupon:::::::', coupon);
    console.log('userId:::::::', userId);
    
    if (!coupon) {
      return res.json({ success: false, message: 'Coupon not found' });
    }

    if (userId && coupon.usedByUsers && coupon.usedByUsers.some(user => user.user_id.equals(userId))) {
      return res.json({ success: false, message: 'Coupon already used by this user' });
    }

    // Mark the coupon as used by this user
    coupon.usedByUsers.push({ user_id: userId });
    await coupon.save();

    // Respond with success
    res.json({ success: true, discount: coupon.discount });
   }
  catch(error){
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}






const loadPlaceOrder = async (req, res) => {
  try {
    let user;
    if (req.session.userId) {
      const userId = req.session.userId;
      user = await usersDb.findOne({ _id: userId });
    }
    if (user) {
      const orders = await Order.find({ userId: user._id });
      res.render("userSide/confirmation", { user, orders });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



module.exports = {
    loadCheckOut,
    postAddress,
    orderConfirmation,
    loadPlaceOrder,
    verifypayment,
    applyCouupon
}