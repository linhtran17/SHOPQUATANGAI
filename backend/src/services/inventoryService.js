const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMove = require('../models/StockMove');

/** Đảm bảo có bản ghi tồn kho cho productId */
async function ensureInventory(productId, session) {
  return Inventory.findOneAndUpdate(
    { productId },
    { $setOnInsert: { productId, stock: 0, reserved: 0, lowStockThreshold: 0 } },
    { upsert: true, new: true, session }
  );
}

/** Thực hiện dịch chuyển kho có transaction + ghi lịch sử */
async function applyMove({ productId, type, qty, note = '', ref = {}, userId = null, mode = null }, session) {
  if (qty <= 0 || !Number.isFinite(qty)) throw new Error('Số lượng không hợp lệ');

  await ensureInventory(productId, session);
  const inv = await Inventory.findOne({ productId }).session(session).lean();
  if (!inv) throw new Error('Không khởi tạo được tồn kho');

  let deltaStock = 0;
  let deltaReserved = 0;

  switch (type) {
    case 'receive':  deltaStock = qty; break;
    case 'issue':    deltaStock = -qty; break;
    case 'adjust':
      if (!mode || !['increase','decrease'].includes(mode)) throw new Error('Thiếu mode increase/decrease');
      deltaStock = (mode === 'increase') ? qty : -qty;
      break;
    case 'stocktake': // qty = countedQty
      deltaStock = qty - inv.stock;
      break;
    case 'reserve':
      if ((inv.stock - inv.reserved) < qty) throw new Error('Không đủ khả dụng để giữ chỗ');
      deltaReserved = qty;
      break;
    case 'release':
      if (inv.reserved < qty) throw new Error('Vượt số giữ chỗ hiện có');
      deltaReserved = -qty;
      break;
    default:
      throw new Error('Loại dịch chuyển không hợp lệ');
  }

  // Không cho âm stock
  if (inv.stock + deltaStock < 0) throw new Error('Xuất vượt tồn kho');

  const updated = await Inventory.findOneAndUpdate(
    { productId },
    { $inc: { stock: deltaStock, reserved: deltaReserved } },
    { new: true, session }
  );

  await StockMove.create([{
    productId, type, qty, deltaStock, deltaReserved,
    ref: { kind: ref?.kind || '', id: ref?.id || null },
    note, by: userId || null
  }], { session });

  return updated;
}

/** Helper run-with-transaction */
async function withSession(fn) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    throw e;
  } finally {
    session.endSession();
  }
}

module.exports = { ensureInventory, applyMove, withSession };
