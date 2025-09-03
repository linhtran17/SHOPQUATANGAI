// backend/src/controllers/addressController.js
const mongoose = require('mongoose');
const Address = require('../models/Address');

function badRequest(msg) { const e = new Error(msg); e.status = 400; return e; }
function notFound(msg = 'Không tìm thấy địa chỉ') { const e = new Error(msg); e.status = 404; return e; }
function normalize(s) { return (s ?? '').toString().trim(); }
function normalizePhone(s) { return normalize(s); }

async function list(req, res, next) {
  try {
    const userId = req.user?._id;
    if (!userId) throw badRequest('Cần đăng nhập');
    const rows = await Address.find({ userId })
      .sort({ is_default: -1, updatedAt: -1 })
      .lean();
    res.json(rows);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?._id;
    if (!userId) throw badRequest('Cần đăng nhập');

    const {
      receiver, phone, address_line,
      ward = '', district = '', province = '',
      is_default = false,
    } = req.body || {};

    if (!normalize(receiver) || !normalize(phone) || !normalize(address_line) ||
        !normalize(district) || !normalize(province)) {
      throw badRequest('Thiếu thông tin bắt buộc (receiver, phone, address_line, district, province)');
    }

    const count = await Address.countDocuments({ userId }).session(session);
    const willDefault = count === 0 || !!is_default;
    if (willDefault) {
      await Address.updateMany({ userId }, { $set: { is_default: false } }, { session });
    }

    const [doc] = await Address.create([{
      userId,
      receiver:     normalize(receiver),
      phone:        normalizePhone(phone),
      address_line: normalize(address_line),
      ward:         normalize(ward),
      district:     normalize(district),
      province:     normalize(province),
      is_default:   willDefault,
    }], { session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(doc);
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(e);
  }
}

async function update(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?._id;
    if (!userId) throw badRequest('Cần đăng nhập');

    const id = req.params.id;
    const body = req.body || {};

    const addr = await Address.findOne({ _id: id, userId }).session(session);
    if (!addr) throw notFound();

    if (body.receiver      !== undefined) addr.receiver     = normalize(body.receiver);
    if (body.phone         !== undefined) addr.phone        = normalizePhone(body.phone);
    if (body.address_line  !== undefined) addr.address_line = normalize(body.address_line);
    if (body.ward          !== undefined) addr.ward         = normalize(body.ward);
    if (body.district      !== undefined) addr.district     = normalize(body.district);
    if (body.province      !== undefined) addr.province     = normalize(body.province);

    if (body.is_default === true) {
      await Address.updateMany({ userId }, { $set: { is_default: false } }, { session });
      addr.is_default = true;
    } else if (body.is_default === false) {
      const others = await Address.countDocuments({ userId, _id: { $ne: addr._id } }).session(session);
      if (addr.is_default && others === 0) {
        addr.is_default = true;
      } else if (addr.is_default && others > 0) {
        addr.is_default = false;
        const pick = await Address.findOne({ userId, _id: { $ne: addr._id } })
          .sort({ updatedAt: -1 }).session(session);
        if (pick) {
          await Address.updateOne({ _id: pick._id }, { $set: { is_default: true } }, { session });
        }
      }
    }

    await addr.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json(addr.toObject());
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(e);
  }
}

async function remove(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?._id;
    if (!userId) throw badRequest('Cần đăng nhập');

    const id = req.params.id;
    const addr = await Address.findOne({ _id: id, userId }).session(session);
    if (!addr) throw notFound();

    const wasDefault = !!addr.is_default;
    await Address.deleteOne({ _id: id, userId }).session(session);

    if (wasDefault) {
      const pick = await Address.findOne({ userId }).sort({ updatedAt: -1 }).session(session);
      if (pick) {
        await Address.updateOne({ _id: pick._id }, { $set: { is_default: true } }, { session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ ok: true });
  } catch (e) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    next(e);
  }
}

module.exports = { list, create, update, remove };
