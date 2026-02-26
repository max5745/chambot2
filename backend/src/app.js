const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");

const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const variantRoutes = require("./routes/variantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const uploadController = require("./controllers/uploadController");
const ocrController = require("./controllers/ocrController");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/reports", reportRoutes);
app.post("/api/upload", uploadController.upload.single("image"), uploadController.uploadImage);
app.post("/api/ocr/scan", ocrController.upload.single("image"), ocrController.scanImage);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message
    });
});

module.exports = app;
