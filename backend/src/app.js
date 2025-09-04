// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { authOptional } = require('./middleware/auth');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Cho public route vẫn có thể biết user (nếu có)
app.use(authOptional);

// Auth
app.use('/api/auth', require('./router/authRoutes'));

// Business routes
app.use('/api/addresses', require('./router/addressRoutes'));
app.use('/api/products',  require('./router/productRoutes'));
app.use('/api/categories',require('./router/categoryRoutes'));
app.use('/api/cart',      require('./router/cartRoutes'));
app.use('/api/orders',    require('./router/orderRoutes'));
app.use('/api/discounts', require('./router/discountRoutes'));
app.use('/api/payments',  require('./router/paymentRoutes'));
app.use('/api/checkout',  require('./router/checkoutRoutes'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
