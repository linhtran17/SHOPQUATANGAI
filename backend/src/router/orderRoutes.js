// backend/src/router/orderRoutes.js
const router = require('express').Router();
const c = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth.db');

router.post('/', requireAuth, c.create);
router.get('/', requireAuth, c.myOrders);
router.get('/:id', requireAuth, c.detail);

module.exports = router;
