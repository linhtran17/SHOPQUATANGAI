const { Schema, model, Types } = require('mongoose');
const DiscountUsageSchema = new Schema({
  code: { type: String, uppercase: true, index: true },
  userId: { type: Types.ObjectId, ref: 'User', index: true },
  orderId: { type: Types.ObjectId, ref: 'Order', index: true },
  amount: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = model('DiscountUsage', DiscountUsageSchema);
