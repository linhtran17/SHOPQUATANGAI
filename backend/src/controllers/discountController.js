const { validateAndCalc, availableForUser, computeQuote } = require('../services/discountService');

exports.available = async (req, res, next) => {
  try {
    const orderAmount = Number(req.query.orderAmount || req.query.amount || 0);
    const shippingAmount = Number(req.query.shippingAmount || 0);
    const items = await availableForUser({ userId: req.user._id, orderAmount, shippingAmount });
    res.json({ items });
  } catch (e) { next(e); }
};

exports.validate = async (req, res, next) => {
  try {
    const { code, amount, kind } = req.body; // kind: 'order' | 'shipping'
    const r = await validateAndCalc({
      code,
      orderAmount: kind === 'shipping' ? 0 : amount,
      shippingAmount: kind === 'shipping' ? amount : 0,
      userId: req.user._id,
      kind
    });
    res.json(r);
  } catch (e) { next(e); }
};

exports.quote = async (req, res, next) => {
  try {
    const { subtotal = 0, shippingFee = 0, discountCode, freeShipCode } = req.body || {};
    const q = await computeQuote({
      userId: req.user._id,
      subtotal,
      shippingFee,
      discountCode,
      freeShipCode
    });
    res.json(q);
  } catch (e) { next(e); }
};
