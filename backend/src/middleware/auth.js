const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolvePermissions } = require('../utils/authz');

function parseBearer(header) {
  if (!header || typeof header !== 'string') return null;
  const h = header.trim();
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/** Không bắt buộc đăng nhập: nếu token hợp lệ thì gán req.user */
async function authOptional(req, _res, next) {
  try {
    const token = parseBearer(req.headers.authorization);
    if (token) {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(p.sub).select('_id email role tokenVersion permAllow permDeny roles');
      if (user) {
        req.user = { _id: String(user._id), email: user.email, role: user.role };
        req.auth = { user, perms: await resolvePermissions(user) };
      }
    }
  } catch (_err) { /* ignore */ }
  return next();
}

/** Bắt buộc đăng nhập + load quyền */
async function requireAuth(req, res, next) {
  try {
    const token = parseBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Cần đăng nhập' });

    const p = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(p.sub).select('_id email role tokenVersion permAllow permDeny roles');
    if (!user) return res.status(401).json({ message: 'Phiên không hợp lệ' });

    if (typeof p.tokv === 'number' && p.tokv !== user.tokenVersion) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập lại' });
    }

    req.user = { _id: String(user._id), email: user.email, role: user.role };
    req.auth = { user, perms: await resolvePermissions(user) };
    return next();
  } catch (_e) {
    return res.status(401).json({ message: 'Phiên không hợp lệ' });
  }
}

/** Check role đơn giản */
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

module.exports = { authOptional, requireAuth, requireRole };
