// backend/src/controllers/authController.js
const { resSuccess, resError } = require('../utils/res.api');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

function sign(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email, tokv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(u) {
  return { _id: String(u._id), email: u.email, name: u.name, role: u.role, roles: u.roles };
}

async function register(req, res, next) {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();
    const name = (req.body.name || '').toString().trim();

    if (!validator.isEmail(email)) return resError(res, 'Email không hợp lệ', 400);
    if (!password || password.length < 6) return resError(res, 'Mật khẩu tối thiểu 6 ký tự', 400);

    const existed = await User.findOne({ email });
    if (existed) return resError(res, 'Email đã tồn tại', 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, roles: ['user'] });
    const token = sign(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) { return next(err); }
}

async function login(req, res, next) {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();

    const user = await User.findOne({ email });
    if (!user) return resError(res, 'Sai email hoặc mật khẩu', 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return resError(res, 'Sai email hoặc mật khẩu', 401);

    const token = sign(user);
    return resSuccess(res, { token, user: sanitizeUser(user) });
  } catch (err) { return next(err); }
}

function me(req, res) {
  return resSuccess(res, { user: req.user || null });
}

function logout(_req, res) {
  return resSuccess(res, { status: true });
}

module.exports = { register, login, me, logout, sign };
