import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';

// Public pages
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductList from './pages/ProductList';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Auth layout & pages
import AuthLayout from './layouts/AuthLayout';
import SignUp from './features/auth/SignUp';
import Login from './features/auth/Login';

// Admin
import RequireAdmin from './features/admin/RequireAdmin';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/pages/Dashboard';
import AdminProductList from './features/admin/pages/products/ProductList';
import AdminProductForm from './features/admin/pages/products/ProductForm';
import AdminCatList from './features/admin/pages/categories/CatList';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Layout với Header và Footer */}
        <Route element={<App />}>
          <Route path="/" element={<HomePage />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />

          {/* Admin */}
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductList />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCatList />} />
          </Route>
        </Route>

        {/* Layout cho các trang Đăng ký và Đăng nhập */}
        <Route element={<AuthLayout />}>
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
