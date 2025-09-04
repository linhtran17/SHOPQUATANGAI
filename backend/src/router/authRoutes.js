// backend/src/router/authRoutes.js
const express = require('express');
const { authOptional } = require('../middleware/auth');
const c = require('../controllers/authController');
const r = express.Router();

r.post('/register', c.register);
r.post('/login', c.login);
r.get('/me', authOptional, c.me);
r.post('/logout', authOptional, c.logout);

module.exports = r;
