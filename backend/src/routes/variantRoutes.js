const express = require("express");
const router = express.Router();
const variantController = require("../controllers/variantController");

router.put("/:id", variantController.updateVariant);
router.patch("/:id/stock", variantController.adjustStock);
router.delete("/:id", variantController.deleteVariant);

module.exports = router;
