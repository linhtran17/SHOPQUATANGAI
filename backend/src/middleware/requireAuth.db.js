const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolvePermissions } = require('../utils/authz');

module.exports = async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : null;
    if (!token) return res.status(401).json({ message: 'Cần đăng nhập' });

    const p = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(p.sub).select('_id email role roles permAllow permDeny tokenVersion');
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
};
