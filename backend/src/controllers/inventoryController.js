// backend/src/controllers/inventoryController.js
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMove = require('../models/StockMove');
const Product = require('../models/Product');
const { applyMove, withSession } = require('../services/inventoryService');

// GET /api/inventory/summary?q=&low=1
exports.summary = async (req, res, next) => {
  try {
    const { q = '', low } = req.query;
    const prodMatch = {};
    if (q) prodMatch.ten = { $regex: String(q).trim(), $options: 'i' };

    const pipeline = [
      { $match: prodMatch },
      { $lookup: { from: 'inventories', localField: '_id', foreignField: 'productId', as: 'inv' } },
      { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
      { $addFields: {
          stock: { $ifNull: ['$inv.stock', 0] },
          reserved: { $ifNull: ['$inv.reserved', 0] },
          lowStockThreshold: { $ifNull: ['$inv.lowStockThreshold', 0] },
        }
      },
      { $addFields: { available: { $subtract: ['$stock', '$reserved'] } } },
    ];

    if (String(low || '') === '1') {
      pipeline.push({ $addFields: { isLow: { $lt: ['$stock', '$lowStockThreshold'] } } });
      pipeline.push({ $match: { isLow: true } });
    }

    pipeline.push({
      $group: {
        _id: null,
        totalSku: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        totalReserved: { $sum: '$reserved' },
        totalAvailable: { $sum: '$available' },
        lowCount: { $sum: { $cond: [{ $lt: ['$stock', '$lowStockThreshold'] }, 1, 0] } },
      }
    });

    const [g] = await Product.aggregate(pipeline);
    res.json(g || { totalSku: 0, totalStock: 0, totalReserved: 0, totalAvailable: 0, lowCount: 0 });
  } catch (e) { next(e); }
};

// GET /api/inventory?q=&page=1&limit=20&low=1
exports.list = async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 20, low } = req.query;
    const _page  = Math.max(1, Number(page));
    const _limit = Math.max(1, Number(limit));
    const skip   = (_page - 1) * _limit;

    const prodMatch = {};
    if (q) prodMatch.ten = { $regex: String(q).trim(), $options: 'i' };

    const base = [
      { $match: prodMatch },
      { $lookup: { from: 'inventories', localField: '_id', foreignField: 'productId', as: 'inv' } },
      { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: 0,
          productId: '$_id',
          ten: 1,
          gia: 1,
          hinhAnh: 1,
          active: 1,
          stock: { $ifNull: ['$inv.stock', 0] },
          reserved: { $ifNull: ['$inv.reserved', 0] },
          lowStockThreshold: { $ifNull: ['$inv.lowStockThreshold', 0] },
          updatedAt: { $ifNull: ['$inv.updatedAt', new Date(0)] }
        }
      }
    ];

    const pipeline = [...base];

    if (String(low || '') === '1') {
      pipeline.push({ $addFields: { isLow: { $lt: ['$stock', '$lowStockThreshold'] } } });
      pipeline.push({ $match: { isLow: true } });
    }

    const [{ n: total } = { n: 0 }] = await Product.aggregate([...pipeline, { $count: 'n' }]);
    const items = await Product.aggregate([
      ...pipeline,
      { $sort: { updatedAt: -1, ten: 1 } },
      { $skip: skip },
      { $limit: _limit }
    ]);

    res.json({ total, items, page: _page, limit: _limit });
  } catch (e) { next(e); }
};

// GET /api/inventory/:productId/history
exports.history = async (req, res, next) => {
  try {
    const productId = new mongoose.Types.ObjectId(req.params.productId);
    const moves = await StockMove.find({ productId }).sort({ createdAt: -1 }).limit(200).lean();
    res.json(moves);
  } catch (e) { next(e); }
};

// PATCH /api/inventory/:productId/threshold { lowStockThreshold }
exports.updateThreshold = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { lowStockThreshold } = req.body;
    const inv = await Inventory.findOneAndUpdate(
      { productId },
      { $set: { lowStockThreshold: Math.max(0, Number(lowStockThreshold || 0)) } },
      { new: true, upsert: true }
    );
    res.json(inv);
  } catch (e) { next(e); }
};

// Helpers
async function move(req, res, next, type, extra = {}) {
  try {
    const { productId } = req.params;
    const { qty, note, mode } = req.body;
    const updated = await withSession((session) =>
      applyMove({ productId, type, qty: Number(qty), note, userId: req.user?._id, mode, ref: extra.ref }, session)
    );
    res.status(201).json(updated);
  } catch (e) { next(e); }
}

exports.receive   = (req, res, next) => move(req, res, next, 'receive');
exports.issue     = (req, res, next) => move(req, res, next, 'issue');
exports.adjust    = (req, res, next) => move(req, res, next, 'adjust');
exports.stocktake = (req, res, next) => move(req, res, next, 'stocktake');
exports.reserve   = (req, res, next) => move(req, res, next, 'reserve');
exports.release   = (req, res, next) => move(req, res, next, 'release');
