module.exports = function authorize(...required) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập' });

    // ✅ Admin đi thẳng
    if (req.user.role === 'admin') return next();

    const perms = req.auth?.perms || [];
    if (!required.length) return next();

    const ok = required.every(p => perms.includes(p) || perms.includes('*'));
    if (!ok) {
      console.warn('[AUTHZ DENY]', { uid: req.user._id, role: req.user.role, need: required, have: perms });
      return res.status(403).json({ message: 'Không đủ quyền' });
    }
    return next();
  };
};
