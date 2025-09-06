// backend/src/router/authRoutes.js
const express = require('express');
const { requireAuth } = require('../middleware/auth'); // 👈 đổi ở đây
const c = require('../controllers/authController');
const r = express.Router();

r.post('/register', c.register);
r.post('/login', c.login);
r.get('/me', requireAuth, c.me);       // 👈 bắt buộc đăng nhập
r.post('/logout', requireAuth, c.logout);

module.exports = r;
