const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log("✅ Mongoose connected");
    
    // Bắt lỗi runtime (nếu có)
    mongoose.connection.on('error', err => {
      console.error('❌ Mongo error:', err);
    });
  } catch (err) {
    console.error("❌ Kết nối Mongo thất bại:", err.message);
    process.exit(1); // dừng server nếu lỗi kết nối
  }
}

module.exports = { connectDB };
