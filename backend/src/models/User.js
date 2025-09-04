// backend/src/models/User.js
const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name:         { type: String },
  // role cũ (để tương thích nơi bạn đã dùng), nhưng nên chuyển sang roles[]
  role: { type: String, enum: ['user','admin'], default: 'user', index: true },

  // Phân quyền mới
  roles:      { type: [String], default: ['user'], index: true }, // ['user','editor']
  permAllow:  { type: [String], default: [] },   // ví dụ: ['product:delete']
  permDeny:   { type: [String], default: [] },   // ví dụ: ['order:setStatus']
  tokenVersion: { type: Number, default: 0 },    // tăng để vô hiệu token cũ
}, { timestamps: true });

module.exports = model('User', UserSchema);
