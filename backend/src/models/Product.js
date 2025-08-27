// src/models/Product.js
const { Schema, model } = require('mongoose');

const ProductSchema = new Schema({
  ten: { type: String, required: true, trim: true },
  gia: { type: Number, required: true, min: 0 },
  hinhAnh: [String],
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true }, // <--- THÊM
  dip: [String], doiTuong: [String], phongCach: [String], loai: [String],
  diemPhoBien: { type: Number, default: 0, index: true },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

ProductSchema.index({ ten: 'text' });
module.exports = model('Product', ProductSchema);
