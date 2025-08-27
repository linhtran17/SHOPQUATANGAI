// src/models/Discount.js
const { Schema, model } = require('mongoose');

const DiscountSchema = new Schema({
  code: { type: String, unique: true, required: true, uppercase: true, trim: true, index: true },
  type: { type: String, enum: ['percent','fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number },
  minOrder: { type: Number, default: 0, min: 0 },
  startAt: Date,
  endAt: Date,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },

  // mới
  target: { type: String, enum: ['order','shipping'], default: 'order', index: true }, // voucher đơn / freeship
  isPublic: { type: Boolean, default: false, index: true },
  perUserLimit: { type: Number, default: 0 },

  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = model('Discount', DiscountSchema);
