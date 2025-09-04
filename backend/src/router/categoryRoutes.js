// backend/src/router/categoryRoutes.js
const express = require('express');
const ctrl = require('../controllers/categoryController');
const requireAuth = require('../middleware/requireAuth.db');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', ctrl.list);              // public
router.get('/tree', ctrl.tree);          // public
router.get('/:idOrSlug', ctrl.detail);   // public

router.post('/', requireAuth, authorize('category:create'), ctrl.create);
router.put('/:id', requireAuth, authorize('category:update'), ctrl.update);
router.delete('/:id', requireAuth, authorize('category:delete'), ctrl.remove);

module.exports = router;
