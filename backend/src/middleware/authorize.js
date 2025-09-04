module.exports = function authorize(permission) {
  return (req, res, next) => {
    const perms = req.auth?.perms;
    if (!perms) return res.status(401).json({ message: 'Cần đăng nhập' });
    if (!perms.has(permission)) return res.status(403).json({ message: 'Không đủ quyền' });
    next();
  };
};
