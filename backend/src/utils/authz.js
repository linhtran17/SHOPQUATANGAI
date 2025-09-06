async function resolvePermissions(user) {
  if (!user) return [];
  if (user.role === 'admin') return ['*']; // ✅ full quyền
  // tuỳ bạn map thêm từ user.permAllow/permDeny
  const allow = Array.isArray(user.permAllow) ? user.permAllow : [];
  const deny  = Array.isArray(user.permDeny)  ? user.permDeny  : [];
  return allow.filter(p => !deny.includes(p));
}

module.exports = { resolvePermissions };
