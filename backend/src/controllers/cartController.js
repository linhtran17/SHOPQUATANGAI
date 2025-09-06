const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

function badRequest(msg) { const e = new Error(msg); e.status = 400; return e; }

async function getOrCreateCart(userId) {
  if (!userId) throw badRequest('Unauthorized');
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

/** GET /api/cart – Trả về giỏ đã kèm thông tin sản phẩm + available */
async function getCart(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const cart = await getOrCreateCart(req.user._id);

    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } })
      .select('ten gia hinhAnh active')
      .lean();
    const invs = await Inventory.find({ productId: { $in: ids } })
      .select('productId stock reserved')
      .lean();

    const byP = new Map(products.map(p => [String(p._id), p]));
    const byI = new Map(invs.map(i => [String(i.productId), i]));

    let subtotal = 0;
    const items = cart.items.map(i => {
      const p = byP.get(String(i.productId));
      const iv = byI.get(String(i.productId)) || { stock: 0, reserved: 0 };
      const available = Math.max(0, (iv.stock || 0) - (iv.reserved || 0));
      const gia = Number(p?.gia || 0);
      subtotal += gia * Number(i.qty || 0);
      return {
        productId: i.productId,
        qty: i.qty,
        product: p ? {
          ten: p.ten,
          gia,
          hinhAnh: Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh || null,
          active: p.active !== false,
        } : null,
        available,
      };
    });

    res.json({ items, subtotal });
  } catch (e) { next(e); }
}

/** POST /api/cart/items { productId, qty } – Thêm vào giỏ (merge dòng), check available */
async function addItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const { productId, qty = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });

    const n = Math.max(1, Number(qty));
    const p = await Product.findOne({ _id: productId, active: true }).lean();
    if (!p) return res.status(400).json({ message: 'Sản phẩm không còn bán' });

    const iv = await Inventory.findOne({ productId }).select('stock reserved').lean();
    const available = Math.max(0, (iv?.stock || 0) - (iv?.reserved || 0));

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
    const nextQty = (idx >= 0 ? cart.items[idx].qty : 0) + n;
    if (nextQty > available) {
      return res.status(400).json({ message: `Không đủ hàng. Khả dụng: ${available}` });
    }

    if (idx >= 0) cart.items[idx].qty = nextQty;
    else cart.items.push({ productId, qty: n });

    await cart.save();
    return getCart(req, res, next);
  } catch (e) { next(e); }
}

/** PUT /api/cart/items/:productId { qty } – Cập nhật số lượng 1 dòng; qty=0 => xoá */
async function updateItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    const qty = Number(req.body.qty);

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });
    if (!Number.isFinite(qty) || qty < 0)
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (idx < 0) return res.status(404).json({ message: 'Item not found in cart' });

    if (qty === 0) {
      cart.items.splice(idx, 1);
    } else {
      const p = await Product.findOne({ _id: productId, active: true }).lean();
      if (!p) {
        cart.items.splice(idx, 1);
      } else {
        const iv = await Inventory.findOne({ productId }).select('stock reserved').lean();
        const available = Math.max(0, (iv?.stock || 0) - (iv?.reserved || 0));
        if (qty > available) return res.status(400).json({ message: `Không đủ hàng. Khả dụng: ${available}` });
        cart.items[idx].qty = qty;
      }
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (e) { next(e); }
}

/** DELETE /api/cart/items/:productId – Xoá 1 dòng */
async function removeItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });

    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
    await cart.save();

    return getCart(req, res, next);
  } catch (e) { next(e); }
}

/** DELETE /api/cart – Xoá sạch giỏ */
async function clear(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    return getCart(req, res, next);
  } catch (e) { next(e); }
}

// Cuối file cartController.js
async function adminList(req, res, next) {
  try {
    const minItems = Math.max(0, Number(req.query.minItems || 0));

    const rows = await Cart.aggregate([
      { $addFields: { count: { $size: { $ifNull: ['$items', []] } } } },
      { $match: { count: { $gte: minItems } } },
      { $sort: { updatedAt: -1 } },
      { $limit: 200 },
      { $project: { userId: 1, items: 1, updatedAt: 1, count: 1 } },
    ]);

    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = { getCart, addItem, updateItem, removeItem, clear,adminList };
