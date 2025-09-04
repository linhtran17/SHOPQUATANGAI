// backend/src/router/productRoutes.js
const express = require('express');
const c = require('../controllers/productController');
const requireAuth = require('../middleware/requireAuth.db');
const authorize = require('../middleware/authorize');

const r = express.Router();

r.get('/', c.list);                              // public
r.get('/:id', c.detail);                         // public
r.post('/', requireAuth, authorize('product:create'), c.create);
r.put('/:id', requireAuth, authorize('product:update'), c.update);
r.delete('/:id', requireAuth, authorize('product:delete'), c.remove);

module.exports = r;
