const path = require('path');
const multer = require('multer');
   
   // Set up multer storage
   const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null,  path.join(__dirname, '..', '/asset/uploads')); // Destination folder for uploads
        
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to avoid conflicts
    },
});
// Initialize multer with the storage options
const upload = multer({ storage: storage });
module.exports = upload;