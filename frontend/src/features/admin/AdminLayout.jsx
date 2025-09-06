import React, { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import authApi from "../../services/authService";
import logo from "../../assets/img/logo.png";

const linkCls = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 transition
   ${isActive ? "bg-rose-500 text-white" : "text-slate-200 hover:bg-rose-500"}`;

export default function AdminLayout() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(true); // thu gọn sidebar

  useEffect(() => {
    authApi.me().then(setMe).catch(() => setMe(null));
  }, []);

  const helloName = useMemo(() => me?.name || me?.email || "Admin", [me]);

  const backToStore = () => nav("/");
  const logout = () => { localStorage.removeItem("token"); nav("/login"); };

  return (
    <div className="min-h-screen bg-slate-50 grid"
         style={{ gridTemplateColumns: open ? "240px 1fr" : "64px 1fr" }}>
      {/* Sidebar */}
      <aside className="bg-rose-600 text-slate-100 p-3">
        <button
          onClick={() => { backToStore(); }}
          className="w-full flex items-center gap-2 mb-3 group"
          title="Về trang bán hàng"
        >
          <img src={logo} alt="Gift Shop" className="h-8 w-8 rounded" />
          {open && (
            <div className="font-extrabold text-[15px] tracking-tight">
              Gift Shop <span className="text-rose-200">Admin</span>
            </div>
          )}
        </button>

        <nav className="space-y-1">
          <NavLink to="/admin" end className={linkCls}>
            <Svg icon="dashboard" /> {open && "Dashboard"}
          </NavLink>

          <NavLink to="/admin/products" className={linkCls}>
            <Svg icon="box" /> {open && "Sản phẩm"}
          </NavLink>

          <NavLink to="/admin/categories" className={linkCls}>
            <Svg icon="tags" /> {open && "Danh mục"}
          </NavLink>

          <NavLink to="/admin/orders" className={linkCls}>
            <Svg icon="orders" /> {open && "Đơn hàng"}
          </NavLink>

          {/* *** Tồn kho (QUAN TRỌNG): nav item đã chuẩn hoá */}
          <NavLink to="/admin/inventory" className={linkCls}>
            <Svg icon="box" /> {open && "Tồn kho"}
          </NavLink>
        </nav>

        {/* Bottom actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded bg-rose-600 hover:bg-rose-500"
          >
            <Svg icon="logout" /> {open && "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="h-14 bg-white/90 text-slate-900 flex items-center px-4 gap-3 border-b border-rose-700/30">
          <button
            onClick={() => setOpen(v => !v)}
            className="rounded-lg p-2 hover:bg-white/10"
            title="Toggle menu"
          >
            <Svg icon="menu" />
          </button>

          <button
            onClick={backToStore}
            className="hidden md:inline rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/15"
            title="Về trang bán hàng"
          >
            ← Về trang bán
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button className="rounded-lg p-2 hover:bg-white/10" title="Thông báo">
              <Svg icon="bell" />
            </button>
            <button className="rounded-lg p-2 hover:bg-white/10" title="Chatbot">
              <Svg icon="chat" />
            </button>

            <div className="pl-2 text-sm">
              Xin chào, <strong>{helloName}</strong>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Svg({ icon, className = "w-5 h-5" }) {
  switch (icon) {
    case "dashboard":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v4h8V3h-8Z"/></svg>);
    case "box":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="M3.3 7.3 12 12l8.7-4.7M12 22V12"/></svg>);
    case "tags":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 7h.01M3 11l8 8 10-10-8-8H3v10Z"/></svg>);
    case "orders":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h18M3 12h18M3 17h18"/></svg>);
    case "menu":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h16M4 18h16"/></svg>);
    case "logout":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>);
    case "bell":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V10a6 6 0 0 0-12 0v4c0 .5-.2 1-.6 1.4L4 17h5"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
    case "chat":
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>);
    default:
      return null;
  }
}
