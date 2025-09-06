import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";

// Public pages
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";

// Auth
import AuthLayout from "./layouts/AuthLayout";
import SignUp from "./features/auth/SignUp";
import Login from "./features/auth/Login";
import RequireAuth from "./features/auth/RequireAuth"; // ✅ thêm để chặn chưa login

// Admin
import RequireAdmin from "./features/admin/RequireAdmin";
import AdminLayout from "./features/admin/AdminLayout";
import Dashboard from "./features/admin/pages/Dashboard";
import ProductList from "./features/admin/pages/products/ProductList";
import CategoryList from "./features/admin/pages/categories/CategoryList";
import ProductForm from "./features/admin/pages/products/ProductForm";
import InventoryList from "./features/admin/pages/inventory/InventoryList";
import OrdersAdminList from "./features/admin/pages/orders/OrdersAdminList";
import OrderAdminDetail from "./features/admin/pages/orders/OrderAdminDetail"; // ✅ trang chi tiết admin
import CartList from "./features/admin/pages/carts/CartList";


// Toast/Notifications
import { NotificationProvider } from "./contexts/Toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          {/* Public layout có Header/Footer */}
          <Route element={<App />}>
            <Route path="/" element={<HomePage />} />
            <Route path="products" element={<HomePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<Checkout />} />

            {/* Yêu cầu đăng nhập để xem đơn của chính mình */}
            <Route
              path="orders"
              element={
                <RequireAuth>
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="orders/:id"
              element={
                <RequireAuth>
                  <OrderDetailPage />
                </RequireAuth>
              }
            />
          </Route>

          {/* Auth layout */}
          <Route element={<AuthLayout />}>
            <Route path="signup" element={<SignUp />} />
            <Route path="login" element={<Login />} />
          </Route>

          {/* Admin layout */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Sản phẩm */}
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm mode="create" />} />
            <Route path="products/:id" element={<ProductForm mode="edit" />} />

             <Route path="categories" element={<CategoryList />} /> 

            {/* Tồn kho */}
            <Route path="inventory" element={<InventoryList />} />

            {/* Đơn hàng (Admin) */}
            <Route path="orders" element={<OrdersAdminList />} />
            <Route path="orders/:id" element={<OrderAdminDetail />} /> {/* ✅ thêm route chi tiết */}

            <Route path="carts" element={<CartList />} />

            {/* 404 trong khu vực admin */}
            <Route
              path="*"
              element={
                <div className="p-6 text-center text-slate-600">
                  Không tìm thấy trang quản trị.
                </div>
              }
            />
          </Route>

          {/* 404 tổng */}
          <Route
            path="*"
            element={
              <div className="p-6 text-center text-slate-600">
                Không tìm thấy trang.
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  </React.StrictMode>
);
