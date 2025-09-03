// backend/src/controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

async function getOrCreateCart(userId) {
  if (!userId) throw new Error('UserId is required');
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

async function getCart(req, res, next) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cart = await getOrCreateCart(req.user._id);

    const productIds = cart.items
      .map(i => i.productId)
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    const products = await Product.find({ _id: { $in: productIds } })
      .select('ten gia hinhAnh')
      .lean();

    const byId = new Map(products.map(p => [String(p._id), p]));

    let subtotal = 0;
    const items = cart.items.map(i => {
      const p = byId.get(String(i.productId));
      const qty = Number(i.qty || 0);
      const price = p ? Number(p.gia || 0) : 0;
      subtotal += qty * price;
      return { productId: i.productId, qty, product: p || null };
    });

    res.json({ items, subtotal });
  } catch (e) {
    console.error('Error in GET /api/cart:', e);
    next(e);
  }
}

async function addItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, qty = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });

    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0)
      return res.status(400).json({ message: 'Quantity must be a positive number' });

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));

    if (idx >= 0) {
      cart.items[idx].qty += quantity;
    } else {
      cart.items.push({ productId, qty: quantity });
    }

    await cart.save();
    res.status(201).json({ ok: true, cart });
  } catch (e) {
    console.error('Error in POST /api/cart/items:', e);
    next(e);
  }
}

async function updateItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { qty } = req.body;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });

    const quantity = Number(qty);
    if (isNaN(quantity) || quantity < 0)
      return res.status(400).json({ message: 'Quantity must be a non-negative number' });

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));

    if (idx < 0) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].qty = quantity;
    }

    await cart.save();
    res.json({ ok: true, cart });
  } catch (e) {
    console.error('Error in PUT /api/cart/items/:productId:', e);
    next(e);
  }
}

async function removeItem(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: 'Invalid productId' });

    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(i => String(i.productId) !== String(productId));

    await cart.save();
    res.json({ ok: true, cart });
  } catch (e) {
    console.error('Error in DELETE /api/cart/items/:productId:', e);
    next(e);
  }
}

async function clear(req, res, next) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({ ok: true, cart });
  } catch (e) {
    console.error('Error in DELETE /api/cart:', e);
    next(e);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clear };
