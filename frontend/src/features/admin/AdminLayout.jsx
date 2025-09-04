import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const link = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm ${
      isActive ? 'bg-rose-100 text-rose-700' : 'hover:bg-rose-50'
    }`;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="card p-3 h-fit">
        <div className="font-bold text-rose-600 mb-2">Admin</div>
        <nav className="space-y-1">
          <NavLink to="/admin" end className={link}>Dashboard</NavLink>
          <NavLink to="/admin/products" className={link}>Sản phẩm</NavLink>
          <NavLink to="/admin/products/new" className={link}>Thêm sản phẩm</NavLink>
          <NavLink to="/admin/categories" className={link}>Danh mục</NavLink>
        </nav>
      </aside>
      <section className="card p-4">
        <Outlet />
      </section>
    </div>
  );
}
