import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen">
      <main className="flex-1 py-6">
        <div className="container">
          <Outlet />  {/* Các trang con (Login/SignUp) sẽ được render ở đây */}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
