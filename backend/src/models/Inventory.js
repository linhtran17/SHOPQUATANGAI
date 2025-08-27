const { Schema, model, Types } = require('mongoose');

const InventorySchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', unique: true, index: true },
  stock: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 }, // dùng khi muốn giữ chỗ
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = model('Inventory', InventorySchema);
