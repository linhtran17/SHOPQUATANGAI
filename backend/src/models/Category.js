const { Schema, model } = require('mongoose');

// chuyển tiếng Việt -> slug đơn giản
const toSlug = (s) => String(s)
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

const CategorySchema = new Schema({
  name:     { type: String, required: true, trim: true },
  slug:     { type: String, required: true, unique: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  active:   { type: Boolean, default: true, index: true },
}, { timestamps: true });

CategorySchema.pre('validate', function(next) {
  if (!this.slug && this.name) this.slug = toSlug(this.name);
  next();
});

module.exports = model('Category', CategorySchema);
