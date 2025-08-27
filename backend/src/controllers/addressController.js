const Address = require('../models/Address');
const { requireAuth } = require('../middleware/auth');

exports.list = async (req, res, next) => {
  try {
    const rows = await Address.find({ userId: req.user._id }).sort({ is_default: -1, createdAt: -1 }).lean();
    res.json(rows);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const doc = await Address.create({ ...req.body, userId: req.user._id });
    if (doc.is_default) {
      await Address.updateMany({ userId: req.user._id, _id: { $ne: doc._id } }, { $set: { is_default: false } });
    }
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const doc = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    if (req.body.is_default === true) {
      await Address.updateMany({ userId: req.user._id, _id: { $ne: req.params.id } }, { $set: { is_default: false } });
    }
    res.json(doc);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const r = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id }).lean();
    if (!r) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
