const { Schema, model, Types } = require('mongoose');

/**
 * Lịch sử dịch chuyển kho:
 * - type: 'receive' (nhập), 'issue' (xuất), 'adjust' (điều chỉnh +/-), 'stocktake' (kiểm kê đặt lại)
 * - 'reserve' / 'release' (giữ chỗ / hủy giữ chỗ)
 * - deltaStock: thay đổi tồn (có thể âm)
 * - deltaReserved: thay đổi giữ chỗ
 */
const StockMoveSchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true, index: true },
  type:      { type: String, enum: ['receive','issue','adjust','stocktake','reserve','release'], required: true },
  qty:       { type: Number, required: true, min: 0 },
  deltaStock:    { type: Number, required: true },
  deltaReserved: { type: Number, default: 0 },
  ref: {
    kind: { type: String, default: '' }, // 'order' | 'purchase' | 'stocktake' ...
    id:   { type: Types.ObjectId, default: null },
  },
  note: { type: String, default: '' },
  by:   { type: Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

StockMoveSchema.index({ productId: 1, createdAt: -1 });

module.exports = model('StockMove', StockMoveSchema);
