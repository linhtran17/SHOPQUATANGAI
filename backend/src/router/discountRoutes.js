// backend/src/router/discountRoutes.js
const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth.db');
const c = require('../controllers/discountController');

router.get('/available', requireAuth, c.available);
router.post('/validate', requireAuth, c.validate);
router.post('/quote',    requireAuth, c.quote);

module.exports = router;
