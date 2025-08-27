const { Schema, model, Types } = require('mongoose');

const OrderSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', index: true },
  items: [{
    productId: { type: Types.ObjectId, ref: 'Product' },
    ten: String,
    gia: Number,
    qty: Number,
    hinhAnh: String
  }],
  tongTien: { type: Number, default: 0 },
  discountCode: String,
  discountAmount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending','confirmed','shipping','delivered','failed','cancelled'], default: 'pending', index: true },
  paymentMethod: { type: String, default: 'cod' },
  thongTinNhanHang: { ten: String, sdt: String, diaChi: String, ghiChu: String }
}, { timestamps: true });

module.exports = model('Order', OrderSchema);
