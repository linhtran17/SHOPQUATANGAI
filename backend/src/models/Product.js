const { Schema, model } = require('mongoose');

const ProductSchema = new Schema(
  {
    ten:        { type: String, required: true, trim: true },
    gia:        { type: Number, required: true, min: 0 },
    moTa:       { type: String, default: '' },

    // ảnh có thể là URL tuyệt đối hoặc tương đối (controller sẽ chuẩn hoá)
    hinhAnh:    { type: [String], default: [] },

    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },

    // một số facets tuỳ chọn
    dip:        { type: [String], default: [] },
    doiTuong:   { type: [String], default: [] },
    phongCach:  { type: [String], default: [] },
    loai:       { type: [String], default: [] },

    diemPhoBien:{ type: Number, default: 0, index: true },

    // QUAN TRỌNG: cờ hiển thị
    active:     { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// full-text theo tên
ProductSchema.index({ ten: 'text' });

module.exports = model('Product', ProductSchema);
