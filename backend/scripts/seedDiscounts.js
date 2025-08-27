require('dotenv').config();
const mongoose = require('mongoose');
const Discount = require('../src/models/Discount');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  await Discount.deleteMany({});

  await Discount.insertMany([
    // Voucher ĐƠN HÀNG
    { code: 'TET10',   target: 'order',   type: 'percent', value: 10, minOrder: 200000, maxDiscount: 50000, usageLimit: 100, isPublic: true, active: true },
    { code: 'GIAM50K', target: 'order',   type: 'fixed',   value: 50000, minOrder: 300000, usageLimit: 0,   isPublic: true, active: true },

    // Voucher FREESHIP (áp vào phí ship)
    { code: 'FREESHIP',  target: 'shipping', type: 'fixed',   value: 15000, maxDiscount: 15000, usageLimit: 0, isPublic: true, active: true },
    // nếu muốn freeship theo %, ví dụ giảm 50% phí ship tối đa 20k:
    // { code: 'FREESHIP50', target: 'shipping', type: 'percent', value: 50, maxDiscount: 20000, usageLimit: 0, isPublic: true, active: true },
  ]);

  console.log('✅ Seed discounts xong');
  process.exit(0);
})();
