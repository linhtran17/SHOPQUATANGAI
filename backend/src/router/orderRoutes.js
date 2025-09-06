// backend/src/router/orderRoutes.js
const router = require('express').Router();
const c = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

// Nếu bạn đã có RBAC:
let authorize;
try { authorize = require('../middleware/authorize'); } catch {
  authorize = () => (_, __, next) => next(); // fallback: luôn cho qua
}

// Admin list/detail
router.get('/admin',    requireAuth, authorize('orders:read'),   c.adminList);
router.get('/admin/:id',requireAuth, authorize('orders:read'),   c.adminDetail);

// User
router.post('/',  requireAuth, c.create);
router.get('/',   requireAuth, c.myOrders);
router.get('/:id',requireAuth, c.detail);

// Admin actions
router.post('/:id/confirm',   requireAuth, authorize('orders:update'), c.confirm);
router.post('/:id/fulfill',   requireAuth, authorize('orders:update'), c.fulfill);
router.post('/:id/cancel',    requireAuth, authorize('orders:update'), c.cancel);
router.post('/:id/delivered', requireAuth, authorize('orders:update'), c.delivered);

module.exports = router;
