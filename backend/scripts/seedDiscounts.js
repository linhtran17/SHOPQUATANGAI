// backend/src/scripts/seedDiscounts.js
require('dotenv').config();
const mongoose = require('mongoose');
const Discount = require('../models/Discount');

async function upsert(code, data) {
  await Discount.updateOne(
    { code },
    { $setOnInsert: { code }, $set: data },
    { upsert: true }
  );
}

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()); // +6 tháng

  // Đơn từ 200k giảm 10k
  await upsert('ORDER_10K', {
    label: 'Giảm 10K (đơn từ 200K)',
    target: 'order',      // 👈 theo model của bạn
    type: 'fixed',        // fixed | percent
    value: 10000,         // số tiền hoặc %
    maxDiscount: undefined,
    minOrder: 200000,
    startAt: now,
    endAt: end,
    usageLimit: 0,        // 0 = không giới hạn
    usedCount: 0,
    perUserLimit: 0,      // 0 = không giới hạn
    isPublic: true,
    active: true,
  });

  // Mặc định có giảm 1k (đơn nhỏ)
  await upsert('ORDER_1K', {
    label: 'Giảm 1K',
    target: 'order',
    type: 'fixed',
    value: 1000,
    maxDiscount: undefined,
    minOrder: 0,
    startAt: now,
    endAt: end,
    usageLimit: 0,
    usedCount: 0,
    perUserLimit: 0,
    isPublic: true,
    active: true,
  });

  // Freeship 1 lần đầu (tối đa 30k)
  await upsert('FREESHIP_FIRST', {
    label: 'Freeship đơn đầu (tối đa 30K)',
    target: 'shipping',
    type: 'fixed',
    value: 30000,         // miễn tối đa 30k (server sẽ min với phí ship thực tế)
    maxDiscount: undefined,
    minOrder: 0,
    startAt: now,
    endAt: end,
    usageLimit: 0,
    usedCount: 0,
    perUserLimit: 1,      // mỗi user 1 lần
    isPublic: true,
    active: true,
  });

  console.log('Seeded discounts ✔');
  await mongoose.disconnect();
  process.exit(0);
})();
