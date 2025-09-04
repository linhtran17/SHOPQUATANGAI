// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

function parseBearer(header) {
  if (!header || typeof header !== 'string') return null;
  const h = header.trim();
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/** Không bắt buộc đăng nhập: nếu có token hợp lệ -> gán req.user; luôn next() */
function authOptional(req, _res, next) {
  try {
    const token = parseBearer(req.headers.authorization);
    if (token) {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: String(p.sub), role: p.role, email: p.email };
    }
  } catch (_err) { /* bỏ qua token hỏng */ }
  return next();
}

/** Bắt buộc vai trò (dựa trên req.user.role đơn giản) */
function requireRole(role) {
  const roles = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không đủ quyền' });
    }
    return next();
  };
}

module.exports = { authOptional, requireRole };
