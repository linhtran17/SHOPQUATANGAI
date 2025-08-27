require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product  = require('../src/models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected Mongo');

    // 1) XÓA DỮ LIỆU CŨ
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log('🧹 Đã xoá products & categories cũ');

    // 2) TẠO CATEGORIES (root trước, rồi children)
    const roots = await Category.insertMany([
      { name: 'Quà Tết',        slug: 'qua-tet' },
      { name: 'Quà Sinh Nhật',  slug: 'qua-sinh-nhat' },
      { name: 'Quà Valentine',  slug: 'qua-valentine' },
      { name: 'Quà Doanh Nghiệp', slug: 'qua-doanh-nghiep' },
    ]);

    const bySlug = Object.fromEntries(roots.map(c => [c.slug, c]));

    const children = await Category.insertMany([
      { name: 'Giỏ quà tổng hợp', slug: 'gio-qua-tong-hop', parentId: bySlug['qua-tet']._id },
      { name: 'Bánh kẹo',         slug: 'banh-keo',         parentId: bySlug['qua-tet']._id },
      { name: 'Trà - Cà phê',     slug: 'tra-ca-phe',       parentId: bySlug['qua-tet']._id },
      { name: 'Socola',           slug: 'socola',           parentId: bySlug['qua-valentine']._id },
      { name: 'Hoa tươi',         slug: 'hoa-tuoi',         parentId: bySlug['qua-sinh-nhat']._id },
      { name: 'Hộp rượu',         slug: 'hop-ruou',         parentId: bySlug['qua-doanh-nghiep']._id },
    ]);

    const allCats = [...roots, ...children];
    const catId = (slug) => allCats.find(c => c.slug === slug)._id;

    console.log('🌳 Đã seed categories');

    // 3) TẠO PRODUCTS (gắn categoryId chuẩn)
    await Product.insertMany([
      {
        ten: 'Chocolate hộp tim',
        gia: 120000,
        hinhAnh: ['https://example.com/choco-heart.jpg'],
        categoryId: catId('socola'),
        loai: ['chocolate'],
        dip: ['sinhnhat','valentine'],
        doiTuong: ['nu'],
        phongCach: ['langman','sweet'],
        diemPhoBien: 50
      },
      {
        ten: 'Hoa hồng bó nhỏ',
        gia: 150000,
        hinhAnh: ['https://example.com/hoa-hong.jpg'],
        categoryId: catId('hoa-tuoi'),
        loai: ['flower'],
        dip: ['sinhnhat','valentine'],
        doiTuong: ['nu'],
        phongCach: ['langman'],
        diemPhoBien: 60
      },
      {
        ten: 'Trà ô long cao cấp',
        gia: 180000,
        hinhAnh: ['https://example.com/tra-olong.jpg'],
        categoryId: catId('tra-ca-phe'),
        loai: ['tea'],
        dip: ['tet','coworker'],
        doiTuong: ['nam','nu'],
        phongCach: ['eco','thanhLich'],
        diemPhoBien: 55
      },
      {
        ten: 'Gấu bông mini',
        gia: 90000,
        hinhAnh: ['https://example.com/gau-bong.jpg'],
        categoryId: catId('qua-sinh-nhat'), // gắn trực tiếp category gốc cũng được
        loai: ['gauBong'],
        dip: ['sinhnhat'],
        doiTuong: ['treem','nu'],
        phongCach: ['deThuong'],
        diemPhoBien: 45
      },
      {
        ten: 'Giỏ quà Tết cao cấp A',
        gia: 650000,
        hinhAnh: ['https://example.com/gio-qua-a.jpg'],
        categoryId: catId('gio-qua-tong-hop'),
        loai: ['gioQua'],
        dip: ['tet'],
        doiTuong: ['giaDinh','doanhNghiep'],
        phongCach: ['sangtrong'],
        diemPhoBien: 70
      },
    ]);

    console.log('✅ Seed xong (categories + products)');
    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  }
})();
