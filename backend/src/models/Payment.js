const { Schema, model, Types } = require('mongoose');
const PaymentSchema = new Schema({
  orderId: { type: Types.ObjectId, ref: 'Order', index: true },
  provider: { type: String, default: 'mock' }, // 'mock'|'vnpay'...
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending','captured','failed','refunded'], default: 'pending', index: true },
  transId: { type: String },
  rawPayload: { type: Schema.Types.Mixed }
}, { timestamps: true });
module.exports = model('Payment', PaymentSchema);
