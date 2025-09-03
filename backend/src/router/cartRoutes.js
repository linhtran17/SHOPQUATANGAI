const router = require('express').Router();
const c = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');  // Middleware xác thực người dùng

// Lấy giỏ hàng của người dùng
router.get('/', requireAuth, c.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/items', requireAuth, c.addItem);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/items/:productId', requireAuth, c.updateItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/items/:productId', requireAuth, c.removeItem);

// Xóa toàn bộ giỏ hàng
router.delete('/', requireAuth, c.clear);

module.exports = router;
