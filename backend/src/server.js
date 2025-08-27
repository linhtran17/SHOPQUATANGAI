require('dotenv').config();
const { connectDB } = require('./config/db');
const app = require('./app');

(async () => {
  await connectDB(process.env.MONGODB_URI);
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
})();
