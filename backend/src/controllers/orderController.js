// backend/src/controllers/orderController.js
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const discountSrv = require('../services/discountService');
const { applyMove, withSession } = require('../services/inventoryService');

function badRequest(msg) { const e = new Error(msg); e.status = 400; return e; }

async function createShipmentFor(order, session) {
  const code = 'SHP' + String(order._id).slice(-6) + Date.now().toString().slice(-4);
  return Shipment.create([{ orderId: order._id, code, fee: order.shippingFee || 0 }], { session });
}

/** Chuẩn hoá địa chỉ về {ten,sdt,diaChi,ghiChu} */
function normalizeShipInfo(input) {
  if (!input || typeof input !== 'object') return {};
  // Kiểu từ Address model
  if (input.receiver || input.address_line || input.province) {
    const parts = [input.address_line, input.ward, input.district, input.province].filter(Boolean);
    return {
      ten:    input.receiver || '',
      sdt:    input.phone || '',
      diaChi: parts.join(', '),
      ghiChu: input.note || input.ghiChu || '',
    };
  }
  // Kiểu từ form tuỳ ý
  return {
    ten:    input.ten || input.name || '',
    sdt:    input.sdt || input.phone || '',
    diaChi: input.diaChi || input.address || input.address_line || '',
    ghiChu: input.ghiChu || input.note || '',
  };
}

/** ========== Tạo đơn (reserve tồn) ========== */
exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user?._id) throw badRequest('Unauthorized');
    const userId = req.user._id;

    // 1) Lấy giỏ
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) throw badRequest('Giỏ hàng trống');

    // 2) Lấy SP & giữ chỗ
    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true })
      .select('ten gia hinhAnh')
      .lean();
    const byId = new Map(products.map(p => [String(p._id), p]));

    let total = 0;
    const snapshot = [];
    for (const line of cart.items) {
      const p = byId.get(String(line.productId));
      if (!p) throw badRequest('Sản phẩm không còn bán');

      // Giữ chỗ (reserve)
      await applyMove({
        productId: line.productId,
        type: 'reserve',
        qty: Number(line.qty),
        note: 'Giữ chỗ khi tạo đơn',
        ref: { kind: 'order' },
        userId
      }, session);

      snapshot.push({
        productId: line.productId,
        ten: p.ten,
        gia: p.gia,
        qty: line.qty,
        hinhAnh: Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh || null
      });
      total += Number(p.gia || 0) * Number(line.qty || 0);
    }

    // 3) Mã giảm giá đơn (tuỳ chọn)
    let discountAmount = 0, discountCode = null, discountDoc = null;
    if (req.body.discountCode) {
      const r = await discountSrv.validateAndCalc({
        code: req.body.discountCode,
        orderAmount: total,
        userId,
        kind: 'order',
      });
      if (!r.valid) throw badRequest('Mã giảm giá không hợp lệ: ' + r.reason);
      discountAmount = r.discount;
      discountCode = r.meta.code;
      discountDoc = r.meta;
      await Discount.updateOne({ _id: r.meta._id }, { $inc: { usedCount: 1 } }, { session });
    }

    // 4) Phí ship (đã tự tính bên ngoài hoặc =0)
    const shippingFee = Math.max(0, Number(req.body.shippingFee || 0));

    // 5) Chuẩn hoá địa chỉ & tạo đơn (đặt PENDING)
    const shipInfo = normalizeShipInfo(req.body.thongTinNhanHang || req.body.address || {});
    const paymentMethod = (req.body.paymentMethod || 'cod').toLowerCase();

    const [order] = await Order.create([{
      userId,
      items: snapshot,
      tongTien: total,
      discountCode,
      discountAmount,
      shippingFee,
      paymentMethod,
      thongTinNhanHang: shipInfo,
      status: 'pending'
    }], { session });

    // Ghi usage sau khi có orderId
    if (discountCode && discountDoc) {
      await DiscountUsage.create([{
        code: discountCode, userId, orderId: order._id, amount: discountAmount
      }], { session });
    }

    // 6) Xoá giỏ
    cart.items = [];
    await cart.save({ session });

    // 7) Tạo phiếu thanh toán nháp nếu online
    if (paymentMethod !== 'cod') {
      const payable = total - discountAmount + shippingFee;
      await Payment.create([{ orderId: order._id, provider: 'mock', amount: payable }], { session });
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(order);
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** ========== Đơn của tôi ========== */
exports.myOrders = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const rows = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const o = await Order.findById(req.params.id).lean();
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (String(o.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Trả về payable để FE hiển thị đúng
    const payable = Math.max(0, (o.tongTien||0) - (o.discountAmount||0) + (o.shippingFee||0));
    res.json({ ...o, payable });
  } catch (e) { next(e); }
};

/** ========== Admin actions ========== */
exports.confirm = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    if (!['pending'].includes(o.status)) return res.status(400).json({ message: 'Chỉ xác nhận đơn đang pending' });
    o.status = 'confirmed';
    await o.save();
    res.json(o);
  } catch (e) { next(e); }
};

exports.fulfill = async (req, res, next) => {
  await withSession(async (session) => {
    const o = await Order.findById(req.params.id).session(session);
    if (!o) throw badRequest('Không tìm thấy đơn');
    if (!['pending', 'confirmed'].includes(o.status)) throw badRequest('Trạng thái không phù hợp để xuất kho');

    for (const it of o.items) {
      await applyMove({
        productId: it.productId,
        type: 'issue',
        qty: it.qty,
        note: `Xuất kho cho đơn #${o._id}`,
        ref: { kind: 'order', id: o._id }
      }, session);
      await applyMove({
        productId: it.productId,
        type: 'release',
        qty: it.qty,
        note: `Nhả giữ chỗ cho đơn #${o._id}`,
        ref: { kind: 'order', id: o._id }
      }, session);
    }

    o.status = 'shipping';
    await o.save({ session });
    await createShipmentFor(o, session);
    return o.toObject();
  }).then(o => res.json(o)).catch(next);
};

exports.cancel = async (req, res, next) => {
  await withSession(async (session) => {
    const o = await Order.findById(req.params.id).session(session);
    if (!o) throw badRequest('Không tìm thấy đơn');
    if (!['pending', 'confirmed'].includes(o.status)) throw badRequest('Không thể huỷ ở trạng thái hiện tại');

    // Nhả giữ chỗ
    for (const it of o.items) {
      await applyMove({
        productId: it.productId,
        type: 'release',
        qty: it.qty,
        note: `Huỷ đơn #${o._id}`,
        ref: { kind: 'order', id: o._id }
      }, session);
    }
    o.status = 'cancelled';
    await o.save({ session });
    return o.toObject();
  }).then(o => res.json(o)).catch(next);
};

exports.delivered = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    if (o.status !== 'shipping') return res.status(400).json({ message: 'Chỉ đánh dấu giao xong khi đang giao' });
    o.status = 'delivered';
    await o.save();
    res.json(o);
  } catch (e) { next(e); }
};

/** ========== Admin list + detail (có tên/email KH) ========== */
exports.adminList = async (req, res, next) => {
  try {
    const { q = '', status = '', page = 1, limit = 20 } = req.query;
    const _page  = Math.max(1, Number(page));
    const _limit = Math.max(1, Math.min(100, Number(limit)));
    const skip   = (_page - 1) * _limit;

    // Pipeline join users
    const base = [
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ];

    const match = {};
    if (status) match.status = status;

    // Tìm theo _id nếu q là ObjectId; nếu không, tìm theo user.name/email hoặc sđt/người nhận trong đơn
    if (q) {
      if (/^[0-9a-fA-F]{24}$/.test(String(q))) {
        match._id = new mongoose.Types.ObjectId(q);
      } else {
        const rx = new RegExp(String(q).trim(), 'i');
        match.$or = [
          { 'user.name': rx },
          { 'user.email': rx },
          { 'thongTinNhanHang.ten': rx },
          { 'thongTinNhanHang.sdt': rx },
        ];
      }
    }

    const project = {
      _id: 1, createdAt: 1, status: 1, paymentMethod: 1,
      tongTien: 1, discountAmount: 1, shippingFee: 1,
      itemsCount: { $sum: '$items.qty' }, // tổng SL mục (nếu cần)
      customer: {
        _id: '$user._id',
        name: { $ifNull: ['$user.name', '$thongTinNhanHang.ten'] },
        email: '$user.email',
      },
      shippingTo: '$thongTinNhanHang',
      payable: { $add: [{ $subtract: ['$tongTien', '$discountAmount'] }, '$shippingFee'] },
    };

    const items = await Order.aggregate([
      ...base,
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: _limit },
      { $project: project }
    ]);

    const [{ total = 0 } = {}] = await Order.aggregate([
      ...base,
      { $match: match },
      { $count: 'total' }
    ]);

    res.json({ items, total, page: _page, limit: _limit });
  } catch (e) { next(e); }
};

exports.adminDetail = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const [payments, shipment] = await Promise.all([
      Payment.find({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Shipment.findOne({ orderId: order._id }).lean(),
    ]);

    const payable = Math.max(0, (order.tongTien||0) - (order.discountAmount||0) + (order.shippingFee||0));
    res.json({
      ...order,
      shippingTo: order.thongTinNhanHang, // alias cho FE
      payable,
      payments,
      shipment,
    });
  } catch (e) { next(e); }
};

