// backend/src/router/paymentRoutes.js
const router = require('express').Router();
const c = require('../controllers/paymentController');
const requireAuth = require('../middleware/requireAuth.db');

router.post('/:id/capture', requireAuth, c.capture); // mock

module.exports = router;
