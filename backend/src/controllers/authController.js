import { resSussess } from '../utils/res.api';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

export const sign = (u) => jwt.sign(
  { sub: String(u._id), role: u.role, email: u.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Đảm bảo bạn export đúng cách với CommonJS
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!validator.isEmail(String(email || '')))
      return res.status(400).json({ message: 'Email không hợp lệ' });
    if (!password || String(password).length < 6)
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });

    const existed = await User.findOne({ email: String(email).toLowerCase() });
    if (existed) return res.status(409).json({ message: 'Email đã tồn tại' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = sign(user);
    res.status(201).json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

    const token = sign(user);
    res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (e) { next(e); }
};

export const me = async (req, res) => {
  resSussess(res, { user: req.user || null })
};

// Đảm bảo bạn export đúng cách
export default { /// <==> module.exports = {}
  register,
  login,
  me,
  logout: (req, res) => {
    res.json({ status: true })
  }
};
