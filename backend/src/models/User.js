const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user','admin'], default: 'user', index: true }
}, { timestamps: true });

module.exports = model('User', UserSchema);
