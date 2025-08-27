const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const { validateAndCalc } = require('../services/discountService');

async function createShipmentFor(order, session) {
  const code = 'SHP' + String(order._id).slice(-6) + Date.now().toString().slice(-4);
  return Shipment.create([{ orderId: order._id, code, fee: order.shippingFee || 0 }], { session });
}

exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true })
      .select('ten gia hinhAnh').lean();
    const byId = new Map(products.map(p => [String(p._id), p]));

    let total = 0;
    const snapshot = [];

    for (const line of cart.items) {
      const p = byId.get(String(line.productId));
      if (!p) throw new Error('Sản phẩm không còn bán');

      const inv = await Inventory.findOneAndUpdate(
        { productId: line.productId, stock: { $gte: line.qty } },
        { $inc: { stock: -line.qty } },
        { new: true, session }
      );
      if (!inv) throw new Error(`Hết hàng: ${p.ten}`);

      snapshot.push({
        productId: line.productId,
        ten: p.ten,
        gia: p.gia,
        qty: line.qty,
        hinhAnh: p.hinhAnh?.[0] || null
      });
      total += p.gia * line.qty;
    }

    // --- Áp mã giảm (nếu có) ---
    let discountAmount = 0;
    let discountCode = null;
    if (req.body.discountCode) {
      const r = await validateAndCalc(req.body.discountCode, total);
      if (!r.valid) {
        throw new Error('Mã giảm giá không hợp lệ: ' + r.reason);
      }
      discountAmount = r.discount;
      discountCode = r.meta.code;
      // tăng usedCount ngay (đơn giản). Nếu bạn muốn chỉ tăng khi thanh toán xong, dời logic này sang Payment capture.
      await Discount.updateOne({ _id: r.meta._id }, { $inc: { usedCount: 1 } }, { session });
    }

    const shippingFee = Number(req.body.shippingFee || 0);
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

    if (discountCode) {
      await DiscountUsage.create([{ code: discountCode, userId, orderId: order._id, amount: discountAmount }], { session });
    }

    // Xoá giỏ
    cart.items = [];
    await cart.save({ session });

    // COD: tạo shipment ngay
    if (order.paymentMethod === 'cod') {
      await createShipmentFor(order, session);
    } else {
      // Non-COD: tạo Payment pending
      const payable = total - discountAmount + shippingFee;
      await Payment.create([{ orderId: order._id, provider: 'mock', amount: payable }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(order);
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(e);
  }
};


exports.myOrders = async (req, res, next) => {
  try {
    const rows = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
  try {
    const o = await Order.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(o);
  } catch (e) { next(e); }
};
