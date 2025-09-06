const express = require('express');
const ctrl = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');
let authorize;
try { authorize = require('../middleware/authorize'); } catch { authorize = () => (_, __, next) => next(); }

const router = express.Router();

// Public
router.get('/', ctrl.list);
router.get('/tree', ctrl.tree);
router.get('/:idOrSlug', ctrl.detail);

// Admin
router.post('/',      requireAuth, authorize('category:create'), ctrl.create);
router.put('/:id',    requireAuth, authorize('category:update'), ctrl.update);
router.patch('/:id/active', requireAuth, authorize('category:update'), ctrl.updateActive);
router.delete('/:id', requireAuth, authorize('category:delete'), ctrl.remove);

module.exports = router;
