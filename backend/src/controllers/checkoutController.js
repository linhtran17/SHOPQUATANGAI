// src/controllers/checkoutController.js
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Shipment = require('../models/Shipment');
const DiscountUsage = require('../models/DiscountUsage');
const Discount = require('../models/Discount');
const { estimateFee } = require('../services/shippingService');
const { validateForTarget, pickBestOrderVoucher, pickBestFreeship } = require('../services/discountService');

exports.preview = async (req, res, next) => {
  try {
    const userId = req.user?._id; // có thể cho phép ẩn danh
    const cart = await Cart.findOne({ userId }).lean();
    if (!cart || cart.items.length===0) return res.json({ items:[], subtotal:0, shipping:0, total:0 });

    // lấy giá hiện tại
    const ids = cart.items.map(i=>i.productId);
    const products = await Product.find({ _id:{ $in:ids }, active:true }).select('ten gia hinhAnh').lean();
    const byId = new Map(products.map(p=>[String(p._id), p]));
    let subtotal=0;
    const lines = cart.items.map(it=>{
      const p = byId.get(String(it.productId));
      if (!p) return null;
      subtotal += p.gia * it.qty;
      return { ...it, ten:p.ten, gia:p.gia, hinhAnh:p.hinhAnh?.[0]||null, weight:0.2 };
    }).filter(Boolean);

    const address = req.body.address || req.query; // tuỳ bạn lấy addressId trước
    const ship = await estimateFee(address, lines);

    const bestOrder = await pickBestOrderVoucher(userId, subtotal);
    const bestShip  = await pickBestFreeship(userId, ship.fee);

    const total = subtotal - bestOrder.discount + ship.fee - bestShip.discount;

    res.json({
      items: lines, subtotal,
      shipping: ship.fee,
      suggest: { orderVoucher: bestOrder, freeship: bestShip },
      total: Math.max(0,total)
    });
  } catch (e){ next(e); }
};

exports.confirm = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user._id;
    const { paymentMethod='cod', address={}, apply={} } = req.body;

    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length===0) throw new Error('Giỏ hàng trống');

    // map giá hiện tại + trừ kho
    const ids = cart.items.map(i=>i.productId);
    const products = await Product.find({ _id:{ $in:ids }, active:true }).select('ten gia hinhAnh').lean();
    const byId = new Map(products.map(p=>[String(p._id), p]));

    let subtotal=0;
    const snap=[];
    for (const it of cart.items){
      const p = byId.get(String(it.productId));
      if (!p) throw new Error('Sản phẩm không còn bán');
      // trừ kho
      const inv = await Inventory.findOneAndUpdate(
        { productId: it.productId, stock: { $gte: it.qty } },
        { $inc: { stock: -it.qty } },
        { new:true, session }
      );
      if (!inv) throw new Error(`Hết hàng: ${p.ten}`);
      subtotal += p.gia * it.qty;
      snap.push({ productId: it.productId, ten:p.ten, gia:p.gia, qty:it.qty, hinhAnh:p.hinhAnh?.[0]||null });
    }

    // ship fee
    const ship = await estimateFee(address, snap);
    let shippingFee = ship.fee;

    // validate voucher người dùng chọn
    let discountAmount = 0, discountCode = null;
    if (apply.orderCode){
      const r = await validateForTarget(apply.orderCode, subtotal, userId, 'order');
      if (!r.valid) throw new Error('Voucher đơn không hợp lệ: '+r.reason);
      discountAmount = r.discount; discountCode = r.meta.code;
      await Discount.updateOne({ _id:r.meta._id }, { $inc:{ usedCount:1 } }, { session });
      await DiscountUsage.create([{ code:r.meta.code, userId, amount:r.discount }], { session });
    }
    if (apply.shipCode){
      const r2 = await validateForTarget(apply.shipCode, shippingFee, userId, 'shipping');
      if (!r2.valid) throw new Error('Voucher freeship không hợp lệ: '+r2.reason);
      shippingFee = Math.max(0, shippingFee - r2.discount);
      await Discount.updateOne({ _id:r2.meta._id }, { $inc:{ usedCount:1 } }, { session });
      await DiscountUsage.create([{ code:r2.meta.code, userId, amount:r2.discount }], { session });
    }

    const orderDoc = {
      userId,
      items: snap,
      tongTien: subtotal,
      discountCode,
      discountAmount,
      shippingFee,
      paymentMethod,
      thongTinNhanHang: {
        ten: address.ten, sdt: address.sdt, diaChi: address.diaChi, province: address.province
      },
      status: paymentMethod==='cod' ? 'confirmed' : 'pending'
    };

    const [order] = await Order.create([orderDoc], { session });

    // clear cart
    cart.items = []; await cart.save({ session });

    if (paymentMethod==='cod'){
      // tạo shipment ngay
      await Shipment.create([{ orderId: order._id, code: 'SHP'+Date.now().toString().slice(-8), fee: shippingFee }], { session });
    } else {
      // tạo payment pending
      const amount = subtotal - discountAmount + shippingFee;
      await Payment.create([{ orderId: order._id, amount, provider:'mock', status:'pending' }], { session });
    }

    await session.commitTransaction(); session.endSession();
    res.status(201).json(order);
  } catch (e){
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(e);
  }
};
