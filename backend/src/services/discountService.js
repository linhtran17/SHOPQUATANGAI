// backend/src/services/discountService.js
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');

function isActive(d, now = new Date()) {
  return d.active !== false
    && (!d.startAt || d.startAt <= now)
    && (!d.endAt || d.endAt >= now)
    && (!d.usageLimit || (Number(d.usedCount || 0) < Number(d.usageLimit)));
}

async function getByCode(code) {
  if (!code) return null;
  return await Discount.findOne({ code: String(code).toUpperCase() }).lean();
}

async function userUsedCount(code, userId) {
  return DiscountUsage.countDocuments({ code: String(code).toUpperCase(), userId });
}

function calcAmount(d, baseAmount) {
  const base = Math.max(0, Number(baseAmount) || 0);
  if (base <= 0) return 0;

  if (d.type === 'percent') {
    let val = Math.floor(base * Number(d.value || 0) / 100);
    if (d.maxDiscount) val = Math.min(val, Number(d.maxDiscount));
    return Math.max(0, val);
  }
  // fixed
  return Math.max(0, Number(d.value) || 0);
}

/**
 * Validate & calc cho 1 mã
 * opts: { code, orderAmount, shippingAmount, userId, kind: 'order' | 'shipping' }
 */
async function validateAndCalc(opts) {
  const { code, orderAmount = 0, shippingAmount = 0, userId, kind } = opts || {};
  const upper = String(code || '').trim().toUpperCase();
  if (!upper) return { valid: false, reason: 'Mã trống' };

  const d = await getByCode(upper);
  if (!d) return { valid: false, reason: 'Không tồn tại' };
  if (!isActive(d)) return { valid: false, reason: 'Mã hết hạn/không hiệu lực' };

  // target phải khớp
  if (kind && d.target !== kind) return { valid: false, reason: 'Mã không áp dụng cho loại này' };

  // per-user limit
  if (d.perUserLimit && userId) {
    const used = await userUsedCount(upper, userId);
    if (used >= d.perUserLimit) return { valid: false, reason: 'Bạn đã dùng hết lượt cho mã này' };
  }

  // minOrder (chỉ áp cho order)
  if (d.target === 'order' && d.minOrder && Number(orderAmount) < Number(d.minOrder)) {
    return { valid: false, reason: `Đơn tối thiểu ${d.minOrder}` };
  }

  // base để tính
  const base = d.target === 'shipping' ? Number(shippingAmount) : Number(orderAmount);
  if (base <= 0) return { valid: false, reason: 'Số tiền không hợp lệ' };

  let discount = calcAmount(d, base);
  if (d.target === 'shipping') {
    // không thể giảm quá phí ship
    discount = Math.min(discount, Number(shippingAmount) || 0);
  }

  return { valid: true, discount, meta: d };
}

/**
 * Tính quote tổng hợp 2 mã: discountCode (order) + freeShipCode (shipping)
 */
async function computeQuote({ userId, subtotal = 0, shippingFee = 0, discountCode, freeShipCode }) {
  const order = Number(subtotal) || 0;
  const ship = Number(shippingFee) || 0;

  let orderDiscount = 0, orderMeta = null, orderErr = null;
  if (discountCode) {
    const r = await validateAndCalc({ code: discountCode, orderAmount: order, userId, kind: 'order' });
    if (r.valid) { orderDiscount = r.discount; orderMeta = r.meta; }
    else orderErr = r.reason;
  }

  let shipDiscount = 0, shipMeta = null, shipErr = null;
  if (freeShipCode) {
    const r = await validateAndCalc({ code: freeShipCode, shippingAmount: ship, userId, kind: 'shipping' });
    if (r.valid) { shipDiscount = r.discount; shipMeta = r.meta; }
    else shipErr = r.reason;
  }

  const total = Math.max(0, order + ship - orderDiscount - shipDiscount);
  return {
    subtotal: order,
    shippingFee: ship,
    order: { code: discountCode || null, discount: orderDiscount, meta: orderMeta, error: orderErr },
    shipping: { code: freeShipCode || null, discount: shipDiscount, meta: shipMeta, error: shipErr },
    total
  };
}

async function availableForUser({ userId, orderAmount = 0, shippingAmount = 0 }) {
  const now = new Date();
  const all = await Discount.find({ active: true, isPublic: true }).lean(); // chỉ show public
  const out = [];

  for (const d of all) {
    if (!isActive(d, now)) continue;

    if (d.perUserLimit && userId) {
      const used = await userUsedCount(d.code, userId);
      if (used >= d.perUserLimit) continue;
    }

    // preview
    let base = d.target === 'shipping' ? Number(shippingAmount) : Number(orderAmount);
    if (d.target === 'order' && d.minOrder && Number(orderAmount) < Number(d.minOrder)) {
      // cho hiện để user biết, preview=0
      out.push({ code: d.code, type: d.type, target: d.target, label: d.label || d.code, preview: 0 });
      continue;
    }
    const preview = d.target === 'shipping'
      ? Math.min(calcAmount(d, base), Number(shippingAmount) || 0)
      : calcAmount(d, base);

    out.push({ code: d.code, type: d.type, target: d.target, label: d.label || d.code, preview: Math.max(0, preview) });
  }

  out.sort((a, b) => b.preview - a.preview);
  return out;
}

module.exports = {
  validateAndCalc,
  computeQuote,
  availableForUser
};
