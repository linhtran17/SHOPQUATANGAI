const { Schema, model, Types } = require('mongoose');

const CartSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', index: true },
  items: [{
    productId: { type: Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 }
  }]
}, { timestamps: true });

module.exports = model('Cart', CartSchema);
