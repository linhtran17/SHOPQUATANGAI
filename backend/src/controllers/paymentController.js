const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');

exports.capture = async (req, res, next) => {
  try {
    const pay = await Payment.findById(req.params.id);
    if (!pay) return res.status(404).json({ message: 'Không tìm thấy payment' });
    // (bảo vệ) chỉ chủ đơn hoặc admin mới được capture mock
    if (String(req.user.role) !== 'admin') {
      const order = await Order.findById(pay.orderId).select('userId');
      if (!order || String(order.userId) !== String(req.user._id))
        return res.status(403).json({ message: 'Không đủ quyền' });
    }
    pay.status = 'captured';
    await pay.save();

    // update order → confirmed & tạo shipment nếu chưa có
    const order = await Order.findById(pay.orderId);
    if (order && order.status !== 'confirmed') {
      order.status = 'confirmed';
      await order.save();
      const exist = await Shipment.findOne({ orderId: order._id });
      if (!exist) {
        const code = 'SHP' + String(order._id).slice(-6) + Date.now().toString().slice(-4);
        await Shipment.create({ orderId: order._id, code, fee: order.shippingFee || 0 });
      }
    }
    res.json({ ok: true, payment: pay });
  } catch (e) { next(e); }
};
