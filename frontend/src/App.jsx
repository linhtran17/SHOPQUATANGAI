import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';  // Dùng Outlet để render các trang con
import Header from './components/Header';  // Đảm bảo Header đã được tạo
import Footer from './components/Footer';  // Đảm bảo Footer đã được tạo
import { NotificationProvider } from './contexts/Toast';
import { CartProvider } from './hooks/useCart';

const App = () => {
  return (
    <NotificationProvider>
      <CartProvider>

        <div className="min-h-screen flex flex-col">
          <Header />  {/* Bao gồm Header */}
<main className="flex-1 pt-2 pb-6 md:pt-3">
            <div className="container">
              <Outlet />  {/* Các trang con sẽ được render ở đây */}
            </div>
          </main>
          <Footer />  {/* Bao gồm Footer */}
        </div>

      </CartProvider>
    </NotificationProvider>
  );
};

export default memo(App);
