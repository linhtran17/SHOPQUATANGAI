const jwt = require('jsonwebtoken');

function authOptional(req, _res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (token) {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: p.sub, role: p.role, email: p.email };
    }
  } catch {}
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });
  next();
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Không đủ quyền' });
    next();
  };
}
module.exports = { authOptional, requireAuth, requireRole };
