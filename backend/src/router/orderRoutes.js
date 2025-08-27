const router = require('express').Router();
const c = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, c.create);
router.get('/', requireAuth, c.myOrders);
router.get('/:id', requireAuth, c.detail);

module.exports = router;
