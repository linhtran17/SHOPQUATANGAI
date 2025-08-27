const { Schema, model, Types } = require('mongoose');
const ShipmentSchema = new Schema({
  orderId: { type: Types.ObjectId, ref: 'Order', unique: true, index: true },
  carrier: { type: String, default: 'INHOUSE' },
  code: { type: String, unique: true, index: true },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['created','picking','in_transit','delivered','failed','cancelled'], default: 'created', index: true }
}, { timestamps: true });
module.exports = model('Shipment', ShipmentSchema);
