const Category = require('../models/Category');

// Helper: build tree từ mảng phẳng
function buildTree(rows) {
  const byId = new Map(rows.map(r => [String(r._id), { ...r, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId) {
      const p = byId.get(String(node.parentId));
      if (p) p.children.push(node); else roots.push(node); // parent bị xoá -> coi như root
    } else roots.push(node);
  }
  return roots;
}

// GET /api/categories?active=true
exports.list = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.active != null) query.active = req.query.active === 'true';
    const rows = await Category.find(query).sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /api/categories/tree?active=true
exports.tree = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.active != null) query.active = req.query.active === 'true';
    const rows = await Category.find(query).sort({ name: 1 }).lean();
    res.json(buildTree(rows));
  } catch (e) { next(e); }
};

// GET /api/categories/:idOrSlug
exports.detail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const cat = await Category.findOne(isId ? { _id: idOrSlug } : { slug: idOrSlug }).lean();
    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(cat);
  } catch (e) { next(e); }
};

// POST /api/categories  { name, parentId?, slug? }
exports.create = async (req, res, next) => {
  try {
    const { name, parentId, slug, active } = req.body;
    if (!name) return res.status(400).json({ message: 'Thiếu trường name' });
    if (parentId && String(parentId) === String(req.body._id))
      return res.status(400).json({ message: 'parentId không được trỏ tới chính nó' });

    const doc = await Category.create({ name, parentId: parentId || null, slug, active });
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Slug đã tồn tại' });
    next(e);
  }
};

// PUT /api/categories/:id   { name?, parentId?, slug?, active? }
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.body.parentId && String(req.body.parentId) === String(id))
      return res.status(400).json({ message: 'parentId không được trỏ tới chính nó' });

    const cat = await Category.findByIdAndUpdate(id, req.body, {
      new: true, runValidators: true,
    }).lean();

    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(cat);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Slug đã tồn tại' });
    next(e);
  }
};

// DELETE /api/categories/:id
// Gợi ý: chỉ xoá khi không có child; thật tế nên soft-delete (active=false)
exports.remove = async (req, res, next) => {
  try {
    const child = await Category.findOne({ parentId: req.params.id }).lean();
    if (child) return res.status(422).json({ message: 'Danh mục có danh mục con, không thể xoá' });

    const r = await Category.findByIdAndDelete(req.params.id).lean();
    if (!r) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
