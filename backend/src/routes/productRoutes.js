const express = require("express");
const router = express.Router();
const adminProductCtrl = require("../controllers/adminProductController");
const adminStockCtrl = require("../controllers/adminStockController");

// Public list & detail
router.get("/", adminProductCtrl.listProducts);
router.get("/:id", adminProductCtrl.getProduct);

// Legacy/Parity routes (should eventually be admin-only via /api/admin/products)
router.post("/", adminProductCtrl.createProduct);
router.put("/:id", adminProductCtrl.updateProduct);
router.delete("/:id", adminProductCtrl.deleteProduct);

// Stock related parity
router.get("/alerts/low-stock", adminStockCtrl.getLowStock);
router.get("/variants/history", adminStockCtrl.getHistory);
router.get("/variants/:variantId/history", adminStockCtrl.getHistory);

module.exports = router;
