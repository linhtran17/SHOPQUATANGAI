// backend/src/router/checkoutRoutes.js
const router = require('express').Router();
const c = require('../controllers/checkoutController');
const requireAuth = require('../middleware/requireAuth.db');

router.post('/preview', requireAuth, c.preview);
router.post('/confirm', requireAuth, c.confirm);

module.exports = router;
