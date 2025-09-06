const { Schema, model, Types } = require('mongoose');

const InventorySchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
  stock: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

InventorySchema.virtual('available').get(function() {
  return Math.max(0, (this.stock || 0) - (this.reserved || 0));
});

module.exports = model('Inventory', InventorySchema);
