const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/adminProductController');
const { requireAdmin } = require('../middleware/auth');

// All product admin routes require admin role
router.use(requireAdmin);

router.get('/', productCtrl.listProducts);
router.post('/', productCtrl.createProduct);
router.get('/:id', productCtrl.getProduct);
router.put('/:id', productCtrl.updateProduct);
router.patch('/:id/toggle', productCtrl.toggleProduct);
router.delete('/:id', productCtrl.deleteProduct);

module.exports = router;
