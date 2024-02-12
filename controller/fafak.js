const placeOrder = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      const newOrder = {
          user: userId,
          items: cart.items.map(items => ({
              product: items.productId,
              quantity: items.quantity,
              price: items.productId.price,
              // status: 'Order placed',
          })),
          totalAmount: req.body.totalAmount || 0,
          selectedAddress: req.body.selectedAddress,
          paymentMethod: req.body.paymentMethod || '',
          status: 'Payment Pending', // Updated status
      };
      const order = await orderModel.create(newOrder);
      const paymentMethod = req.body.paymentMethod;
      req.session.orderId = order._id

      if (paymentMethod === 'COD') {
          await orderModel.updateOne({ _id: order._id }, { $set: { status: "order placed" } });

          // Update product quantities
          for (const item of cart.items) {
              const productId = item.productId._id;
              const quantityToSubtract = item.quantity;
              // Subtract the quantity from the product in the database
              await Products.findByIdAndUpdate(productId, { $inc: { quantity: -quantityToSubtract } });
              console.log('quantiy decreased');
          }
          delete req.session.discountAmount;
          await Cart.findOneAndDelete({ userId });
          console.log('cart items deleted');
          // res.status(201).json(order); // Sending the created order as a response
          res.json({ codSuccess: true })
      } else {
          var options = {
              amount: parseInt(req.body.totalAmount) * 100,  // amount in the smallest currency unit
              currency: "INR",
              receipt: order._id
          };
          instance.orders.create(options, function (err, razorpayOrder) {
              if (err) {
                  console.log(err);
              } else {
                  // res.status(201).json(razorpayOrder); // Sending the created order as a response
                  res.json({ razorpayOrder });

                  console.log('razorpay order ', razorpayOrder);
              }

          });
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

const verifyPayment = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      console.log('verify pymnt ', req.body);
      const response = req.body.response
      const bodyOrder = req.body.order
      var crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'f8OZaeUgk7Yo8Ufa8qK5L1qF')
      hmac.update(response.razorpay_order_id + '|' + response.razorpay_payment_id)
      hmac = hmac.digest('hex')
      if (hmac == response.razorpay_signature) {
          //change order status
          await orderModel.updateOne({ _id: bodyOrder.receipt }, { $set: { status: "order placed" } });
          // Update product quantities
          for (const item of cart.items) {
              const productId = item.productId._id;
              const quantityToSubtract = item.quantity;
              // Subtract the quantity from the product in the database
              await Products.findByIdAndUpdate(productId, { $inc: { quantity: -quantityToSubtract } });
              console.log('quantiy decreased');
          }
          delete req.session.discountAmount;
          await Cart.findOneAndDelete({ userId });
          console.log('cart items deleted');
          res.json({ status: true })
      }
  } catch (error) {
      console.log('verify err ', error.message);
  }

}