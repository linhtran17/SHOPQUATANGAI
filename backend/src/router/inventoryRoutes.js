const router = require('express').Router();
const c = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// ⚠️ Đặt /summary TRƯỚC các route có :param để không bị nuốt route
router.get('/summary',            requireAuth, authorize('inventory:read'),   c.summary);
router.get('/',                   requireAuth, authorize('inventory:read'),   c.list);
router.get('/:productId/history', requireAuth, authorize('inventory:read'),   c.history);

router.patch('/:productId/threshold', requireAuth, authorize('inventory:update'), c.updateThreshold);

router.post('/:productId/receive',   requireAuth, authorize('inventory:update'), c.receive);
router.post('/:productId/issue',     requireAuth, authorize('inventory:update'), c.issue);
router.post('/:productId/adjust',    requireAuth, authorize('inventory:update'), c.adjust);
router.post('/:productId/stocktake', requireAuth, authorize('inventory:update'), c.stocktake);

router.post('/:productId/reserve',   requireAuth, authorize('inventory:update'), c.reserve);
router.post('/:productId/release',   requireAuth, authorize('inventory:update'), c.release);

module.exports = router;
