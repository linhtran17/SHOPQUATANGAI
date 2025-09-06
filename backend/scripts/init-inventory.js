// node backend/scripts/init-inventory.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
    const products = await Product.find({}).select('_id').lean();
    let created = 0;
    for (const p of products) {
      const exist = await Inventory.findOne({ productId: p._id }).lean();
      if (!exist) {
        await Inventory.create({ productId: p._id, stock: 0, reserved: 0, lowStockThreshold: 5 });
        created++;
      }
    }
    console.log(`Done. Created ${created} inventory records.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
