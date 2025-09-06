const { Schema, model, Types } = require('mongoose');

const CartItemSchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  qty:       { type: Number, required: true, min: 1 },
}, { _id: false });

const CartSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items:  { type: [CartItemSchema], default: [] },
}, { timestamps: true });

module.exports = model('Cart', CartSchema);
