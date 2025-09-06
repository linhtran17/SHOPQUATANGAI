const express = require('express');
const c = require('../controllers/productController');
const { authOptional, requireAuth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const r = express.Router();

// Public (kèm token nếu có để biết admin)
r.get('/',    authOptional, c.list);
r.get('/:id', authOptional, c.detail);

// Mutations
r.post('/',           requireAuth, authorize('product:create'), c.create);
r.put('/:id',         requireAuth, authorize('product:update'), c.update);
// Bật/Tắt trạng thái riêng
r.patch('/:id/active',requireAuth, authorize('product:update'), c.setActive);
r.delete('/:id',      requireAuth, authorize('product:delete'), c.remove);

module.exports = r;
