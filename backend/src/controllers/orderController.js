const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const discountSrv = require('../services/discountService');

function badRequest(msg) {
  const e = new Error(msg);
  e.status = 400;
  return e;
}

async function createShipmentFor(order, session) {
  const code = 'SHP' + String(order._id).slice(-6) + Date.now().toString().slice(-4);
  return Shipment.create([{ orderId: order._id, code, fee: order.shippingFee || 0 }], { session });
}

// -------- CREATE ORDER --------
async function create(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user?._id) throw badRequest('Unauthorized');
    const userId = req.user._id;

    // 1) Lấy giỏ
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) throw badRequest('Giỏ hàng trống');

    // 2) Lấy sản phẩm & tính tổng + trừ tồn
    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true })
      .select('ten gia hinhAnh').lean();
    const byId = new Map(products.map(p => [String(p._id), p]));

    let total = 0;
    const snapshot = [];
    for (const line of cart.items) {
      const p = byId.get(String(line.productId));
      if (!p) throw badRequest('Sản phẩm không còn bán');

      const inv = await Inventory.findOneAndUpdate(
        { productId: line.productId, stock: { $gte: line.qty } },
        { $inc: { stock: -line.qty } },
        { new: true, session }
      );
      if (!inv) throw badRequest(`Hết hàng: ${p.ten}`);

      snapshot.push({
        productId: line.productId,
        ten: p.ten,
        gia: p.gia,
        qty: line.qty,
        hinhAnh: Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh || null
      });
      total += Number(p.gia || 0) * Number(line.qty || 0);
    }

    // 3) Áp mã giảm đơn (target = 'order')
    let discountAmount = 0;
    let discountCode = null;
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
      await Discount.updateOne({ _id: r.meta._id }, { $inc: { usedCount: 1 } }, { session });
    }

    // 4) Áp freeship (target = 'shipping')
    const originShip = Number(req.body.shippingFee || 0);
    let shippingDiscount = 0;
    let freeShipCode = null;
    if (req.body.freeShipCode) {
      const sr = await discountSrv.validateAndCalc({
        code: req.body.freeShipCode,
        shippingAmount: originShip,
        userId,
        kind: 'shipping',
      });
      if (!sr.valid) throw badRequest('Mã freeship không hợp lệ: ' + sr.reason);
      shippingDiscount = sr.discount;
      freeShipCode = sr.meta.code;
      await Discount.updateOne({ _id: sr.meta._id }, { $inc: { usedCount: 1 } }, { session });
    }
    const shippingFee = Math.max(0, originShip - shippingDiscount);

    // 5) Tạo đơn
    const orderDoc = {
      userId,
      items: snapshot,
      tongTien: total,
      discountCode,
      discountAmount,
      shippingFee,
      paymentMethod: req.body.paymentMethod || 'cod',
      thongTinNhanHang: req.body.address || {},
      status: req.body.paymentMethod === 'cod' || !req.body.paymentMethod ? 'confirmed' : 'pending'
    };
    const [order] = await Order.create([orderDoc], { session });

    // 6) Log usage
    if (discountCode) {
      await DiscountUsage.create([{ code: discountCode, userId, orderId: order._id, amount: discountAmount }], { session });
    }
    if (freeShipCode) {
      await DiscountUsage.create([{ code: freeShipCode, userId, orderId: order._id, amount: shippingDiscount }], { session });
    }

    // 7) Xoá giỏ
    cart.items = [];
    await cart.save({ session });

    // 8) Tuỳ phương thức
    if (order.paymentMethod === 'cod') {
      await createShipmentFor(order, session);
    } else {
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
    return next(e);
  }
}

// -------- LIST MY ORDERS --------
async function myOrders(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const rows = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (e) { next(e); }
}

// -------- ORDER DETAIL --------
async function detail(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const o = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(o);
  } catch (e) { next(e); }
}

module.exports = { create, myOrders, detail };
