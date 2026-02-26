const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/alerts/low-stock", productController.getLowStockProducts);
router.get("/variants", productController.getAllVariants);
router.patch("/variants/:variantId/stock", productController.adjustStock);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.patch("/variants/:variantId/set-main", productController.setMainVariant);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
