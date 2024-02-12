const Product = require("../model/product");
const usersDb = require("../model/users");
const Cart = require("../model/cart");

const loadCart = async (req, res) => {
    try {
        let User;
        // console.log('cart session', req.session.userId);
        if (req.session.userId) {
            const userId = req.session.userId;
            User = await usersDb.findOne({ _id: userId });
        }

        if (!User) {
            res.redirect('/login');
        } else {
            const cartDetails = await Cart.findOne({ userId: User._id }).populate({ path: 'items.product_id', model: 'Product' });
            const user = await usersDb.findOne({ _id: User._id });
            

            let originalAmount = 0;

            if (cartDetails) {
                cartDetails.items.forEach((cartItem) => {
                    let itemTotalPrice = cartItem.total_price;
                    originalAmount += itemTotalPrice;
                });
            }
            console.log('cart:', cartDetails);
            res.render('userSide/cart', { user, cartDetails, subTotal: originalAmount});
        }
    } catch (error) {
        console.log(error.message);
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!req.session.userId) {
            return res.json({ success: false, message: 'User not authenticated. Please log in.' });
        }
        const user = await usersDb.findOne({ _id: req.session.userId });
        if (!user) {
            return res.json({ success: false, message: 'User not found.' });
        }
        const product = await Product.findOne({ _id: productId });
        // Check if the product exists
        if (!product) {
            return res.json({ success: false, message: 'Product not found.' });
        }
        // Find the user's cart or create a new one if not exists
        let userCart = await Cart.findOne({ userId: req.session.userId });
        if (!userCart) {
            userCart = new Cart({ userId: req.session.userId, items: [] });
        }
        // Check if the product is already in the cart
        const existingProduct = userCart.items.find(
            (item) => item.product_id.toString() === productId
        );

        if (existingProduct) {
            // If the product is already in the cart, update the quantity
            const newTotalQuantity = existingProduct.quantity + parseInt(quantity, 10);
            if (newTotalQuantity > product.quantity) {
                return res.json({ success: false, message: 'Exceeds available quantity' });
            }
            await Cart.findOneAndUpdate(
                { userId: req.session.userId, 'items.product_id': productId },
                {
                    $inc: {
                        'items.$.quantity': parseInt(quantity, 10),
                        'items.$.total_price': parseInt(quantity, 10) * existingProduct.price,
                    },
                }
            );
        } else {
            // If the product is not in the cart, add it
            if (parseInt(quantity, 10) > product.quantity) {
                return res.json({ success: false, message: 'Exceeds available quantity' });
            }
            userCart.items.push({
                product_id: productId,
                quantity: quantity,
                price: product.price,
                total_price: quantity * product.price,
            });
            await userCart.save();
        }
        return res.json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error(error.message);
        return res.json({ success: false, message: 'Error adding product to cart' });
    }
};

const quantityUpdate = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const { cartId, productId, countData } = req.body;
        const count = parseInt(countData);
        console.log("Count:", count);

        const userId = req.session.userId;
        let userCart = await Cart.findOne({ userId });

        if (!userCart) {
            return res.json({ success: false, message: 'Cart not found.' });
        }

        const existingProduct = userCart.items.find(item => item.product_id.equals(productId));
        if (!existingProduct) {
            return res.json({ success: false, message: 'Product not found in the cart.' });
        }

        console.log("Existing Product:", existingProduct);

        // Increment or decrement the quantity based on count
        if (count === 1) {
            existingProduct.quantity += 1;
        } else if (count === -1 && existingProduct.quantity > 1) { // Ensure quantity doesn't go below 1
            existingProduct.quantity -= 1;
        } else {
            return res.json({ success: false, message: 'Invalid count.' });
        }

        // Save the updated cart
        await userCart.save();

        console.log("Updated Cart:", userCart);

        const response = { success: true, newQuantity: existingProduct.quantity };
        return res.json(response);
    } catch (error) {
        console.error("Error:", error);
        return res.json({ success: false, message: 'Error updating quantity.' });
    }
};



const deleteItems = async (req, res) => {
    try {
        let user;
        console.log('cart session', req.session.userId);
        if (req.session.userId) {
            const userId = req.session.userId;
            user = await usersDb.findOne({ _id: userId });
        }
        const productOgId = req.body.productOgId;
        const cartUser = await Cart.findOne({ userId: user });
        if (cartUser.items.length == 1) {
            await Cart.deleteOne({ userId: user });
        } else {
            await Cart.updateOne({ userId: user }, { $pull: { items: { _id: productOgId } } });
        }

        res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
    loadCart,
    addToCart,
    quantityUpdate,
    deleteItems,
};
