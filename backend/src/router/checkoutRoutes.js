// backend/src/router/checkoutRoutes.js
const router = require('express').Router();
const c = require('../controllers/checkoutController');
// Đúng
const { requireAuth } = require('../middleware/auth');

router.post('/preview', requireAuth, c.preview);
router.post('/confirm', requireAuth, c.confirm);

module.exports = router;
