// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { authOptional } = require('./middleware/auth');
const categoryRoutes = require('./router/categoryRoutes');  
const productRoutes = require('./router/productRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(authOptional);                 // đặt trước các routers
app.use('/api/auth', require('./router/authRoutes'));
app.use('/api/addresses', require('./router/addressRoutes'));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', require('./router/cartRoutes'));
app.use('/api/orders', require('./router/orderRoutes'));
app.use('/api/discounts', require('./router/discountRoutes'));
app.use('/api/payments', require('./router/paymentRoutes'));
app.use('/api/checkout', require('./router/checkoutRoutes'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));







app.get('/health', (_, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
