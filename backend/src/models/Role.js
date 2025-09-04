// backend/src/models/Role.js
const { Schema, model } = require('mongoose');

const RoleSchema = new Schema({
  name: { type: String, unique: true, required: true },       // 'admin', 'editor', ...
  permissions: { type: [String], default: [] },               // ['product:create', 'order:listAll', ...]
}, { timestamps: true });

module.exports = model('Role', RoleSchema);
