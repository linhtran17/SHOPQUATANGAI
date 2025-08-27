const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let c = await Cart.findOne({ userId });
  if (!c) c = await Cart.create({ userId, items: [] });
  return c;
}

// GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } }).select('ten gia hinhAnh').lean();
    const byId = new Map(products.map(p => [String(p._id), p]));
    let subtotal = 0;
    const items = cart.items.map(i => {
      const p = byId.get(String(i.productId));
      if (p) subtotal += p.gia * i.qty;
      return { productId: i.productId, qty: i.qty, product: p || null };
    });
    res.json({ items, subtotal });
  } catch (e) { next(e); }
};

// POST /api/cart/items { productId, qty }
exports.addItem = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;
    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (idx >= 0) cart.items[idx].qty += Number(qty);
    else cart.items.push({ productId, qty: Number(qty) });
    await cart.save();
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
};

// PUT /api/cart/items/:productId { qty }
exports.updateItem = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (idx < 0) return res.status(404).json({ message: 'Mặt hàng không có trong giỏ' });
    cart.items[idx].qty = Number(qty);
    await cart.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(i => String(i.productId) !== String(req.params.productId));
    await cart.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.clear = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};
