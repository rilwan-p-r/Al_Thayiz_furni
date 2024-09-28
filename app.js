require("dotenv").config();
// ------------------DB connection
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://rilwanpr:rTKW6GLzUPekRjoq@althayiz.f3nhgyj.mongodb.net/");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});

// ------------------requiring
const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// -----------view engine setting
app.use(express.static('asset'));  // -----css setting
app.set("view engine", "ejs");

// -----middleware
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

// ---------------port number
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
