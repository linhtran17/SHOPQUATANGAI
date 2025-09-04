const Role = require('../models/Role');

async function resolvePermissions(user) {
  const set = new Set();
  const roles = await Role.find({ name: { $in: user.roles || [] } }, { permissions: 1 });
  roles.forEach(r => (r.permissions || []).forEach(p => set.add(p)));
  (user.permAllow || []).forEach(p => set.add(p));
  (user.permDeny || []).forEach(p => set.delete(p));
  return set;
}

module.exports = { resolvePermissions };
