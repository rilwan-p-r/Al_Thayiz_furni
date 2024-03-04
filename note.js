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

// Function to handle file uploads
const handleFileUpload = async (file) => {
    const { filename, path: filePath } = file;
    const uniqueFilename = uuidv4() + path.extname(filename); // Generate unique filename
    const newPath = path.join(__dirname, '..', 'asset', 'uploads', uniqueFilename);

    // Move the file to the uploads directory with the unique filename
    await fs.rename(filePath, newPath);

    return uniqueFilename;
};

const addProduct = async (req, res) => {
    try {
        const productId = req.params?.productId;
        const { product_name, description, price, quantity, editMode, category: categoryId ,brand} = req.body;

        if (req.session.isLogged) {
            const categories = await category.find();

            if (editMode === 'true') {
                // Update existing product
                await Product.findByIdAndUpdate(productId, { product_name, description, price, quantity, brand });
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
                    brand: brand
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
        const { product_name, brand, description, price, quantity, category,productId } = req.body;
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

     const proData =  await  Product.updateOne({_id:productId},{$set:{name:product_name,brand:brand,description:description,price:price,quantity:quantity,category:category,productImages:productImages}})
       
     if(proData){
        res.redirect('/admin/loadProductList')
     }


    } catch (error) {
        console.log(error.message)
    }
    }