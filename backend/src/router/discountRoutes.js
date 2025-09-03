const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/discountController');

router.get('/available', requireAuth, c.available);
router.post('/validate', requireAuth, c.validate);
router.post('/quote', requireAuth, c.quote);     // 👈 NEW: trả bảng tính tổng

module.exports = router;
