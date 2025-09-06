const Product  = require('../models/Product');
const Category = require('../models/Category');

const toArray = v => !v ? [] : Array.isArray(v) ? v
  : String(v).split(',').map(s => s.trim()).filter(Boolean);

function withAbsImages(doc, req) {
  const fallbackBase = `${req.protocol}://${req.get('host')}`;
  const base = (process.env.APP_URL || fallbackBase).replace(/\/+$/, '');
  const imgs = (doc.hinhAnh || []).map(p =>
    /^https?:\/\//.test(p) ? p : `${base}/${String(p).replace(/^\/+/, '')}`
  );
  return { ...doc, hinhAnh: imgs };
}

async function getDescendantIds(rootId) {
  const cats = await Category.find({ active: true }).select('_id parentId').lean();
  const idStr = String(rootId);
  const childrenMap = new Map();
  for (const c of cats) {
    const p = String(c.parentId || '');
    if (!childrenMap.has(p)) childrenMap.set(p, []);
    childrenMap.get(p).push(String(c._id));
  }
  const result = new Set([idStr]);
  const stack = [idStr];
  while (stack.length) {
    const cur = stack.pop();
    const kids = childrenMap.get(cur) || [];
    for (const k of kids) if (!result.has(k)) { result.add(k); stack.push(k); }
  }
  return Array.from(result);
}

exports.list = async (req, res, next) => {
  try {
    const { q, dip, doiTuong, categoryId, categorySlug,
      min = 0, max = 1e12, page = 1, limit = 20, sort = 'phoBien', all } = req.query;

    const seeAll  = String(all || '') === '1';
    const isAdmin = req.user?.role === 'admin';

    const query = { gia: { $gte: Number(min), $lte: Number(max) } };
    // Public chỉ thấy active=true; admin + all=1 thấy tất cả
    if (!(seeAll && isAdmin)) query.active = true;

    if (categoryId || categorySlug) {
      let rootCat = null;
      if (categoryId && /^[0-9a-fA-F]{24}$/.test(categoryId)) {
        rootCat = await Category.findById(categoryId).select('_id').lean();
      } else if (categorySlug) {
        rootCat = await Category.findOne({ slug: categorySlug }).select('_id').lean();
      }
      if (!rootCat) {
        return res.json({ items: [], total: 0, page: Number(page)||1, limit: Number(limit)||20 });
      }
      const ids = await getDescendantIds(rootCat._id);
      query.categoryId = { $in: ids };
    }

    const dipArr = toArray(dip);
    const dtArr  = toArray(doiTuong);
    const ors = [];
    if (dipArr.length) ors.push({ dip: { $in: dipArr } });
    if (dtArr.length)  ors.push({ doiTuong: { $in: dtArr } });
    if (ors.length) query.$or = ors;

    if (q) query.$text = { $search: q };

    const sortMap = {
      phoBien: { diemPhoBien: -1, _id: -1 },
      giaAsc:  { gia: 1 },
      giaDesc: { gia: -1 },
      moiNhat: { createdAt: -1 },
    };
    const sortSpec = sortMap[sort] || sortMap.phoBien;

    const pageNum  = Math.max(1, Number(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      items: items.map(it => withAbsImages(it, req)),
      total, page: pageNum, limit: limitNum
    });
  } catch (err) { next(err); }
};

exports.detail = async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && item.active === false) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(withAbsImages(item, req));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { ten, gia } = req.body;
    if (!ten || gia == null) return res.status(400).json({ message: 'Thiếu trường bắt buộc: ten, gia' });
    if (Number(gia) < 0)     return res.status(422).json({ message: 'Giá phải >= 0' });

    const product = await Product.create(req.body);
    res.status(201).json(withAbsImages(product.toObject(), req));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.body.gia != null && Number(req.body.gia) < 0)
      return res.status(422).json({ message: 'Giá phải >= 0' });

    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true, lean: true }
    );
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(withAbsImages(product, req));
  } catch (err) { next(err); }
};

// 🔥 Bật/Tắt trạng thái – KHÔNG XOÁ
exports.setActive = async (req, res, next) => {
  try {
    const { active } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: !!active },
      { new: true, runValidators: true, lean: true }
    );
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(withAbsImages(product, req));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
