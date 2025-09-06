// backend/src/router/paymentRoutes.js
const router = require('express').Router();
const c = require('../controllers/paymentController');
// Đúng
const { requireAuth } = require('../middleware/auth');

router.post('/:id/capture', requireAuth, c.capture); // mock

module.exports = router;
