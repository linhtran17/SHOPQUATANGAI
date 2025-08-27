const { Schema, model, Types } = require('mongoose');

const AddressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
  receiver: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address_line: { type: String, required: true, trim: true },
  ward: String, district: String, province: String,
  is_default: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = model('Address', AddressSchema);
