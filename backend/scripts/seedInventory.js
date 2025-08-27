require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const products = await Product.find({}).select('_id').lean();
  for (const p of products) {
    await Inventory.updateOne(
      { productId: p._id },
      { $setOnInsert: { stock: 20, reserved: 0, lowStockThreshold: 5 } },
      { upsert: true }
    );
  }
  console.log('✅ Seed inventory xong');
  process.exit(0);
})();
