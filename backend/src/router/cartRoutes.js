
// backend/src/router/cartRoutes.js
const router = require('express').Router();
const c = require('../controllers/cartController');
const requireAuth = require('../middleware/requireAuth.db');

router.get('/', requireAuth, c.getCart);
router.post('/items', requireAuth, c.addItem);
router.put('/items/:productId', requireAuth, c.updateItem);
router.delete('/items/:productId', requireAuth, c.removeItem);
router.delete('/', requireAuth, c.clear);

module.exports = router;

