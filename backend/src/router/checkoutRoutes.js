// src/router/checkoutRoutes.js
const router = require('express').Router();
const c = require('../controllers/checkoutController');
const { requireAuth } = require('../middleware/auth');

router.post('/preview', requireAuth, c.preview);  // gửi address vào body
router.post('/confirm', requireAuth, c.confirm);  // address + apply {orderCode, shipCode}

module.exports = router;
