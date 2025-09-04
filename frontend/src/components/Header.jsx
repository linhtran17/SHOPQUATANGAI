import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import authApi from "../services/authService";
import { useCart } from "../hooks/useCart";
import logo from "../assets/img/logohong.png"; // 👈 import đúng chuẩn Vite

function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { cart } = useCart();

  const onSearch = (e) => {
    e.preventDefault();
    nav(`/products?${new URLSearchParams({ q: (q || "").trim(), page: "1" })}`);
    setOpen(false);
  };

  const itemCount = useMemo(() => (cart?.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0), [cart?.items]);

  const fetchMe = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchMe(); else { setUser(null); setChecking(false); }
  }, [fetchMe]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    nav("/login");
  };

  const NavA = ({ to, end, children }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-[14px] transition ${isActive ? "text-rose-600 bg-rose-50" : "text-slate-700 hover:text-rose-600 hover:bg-rose-50"}`
      }
    >{children}</NavLink>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-rose-100">
      <div className="hidden md:block bg-rose-600">
        <div className="container px-3.5 py-2 text-[13px] text-white flex items-center gap-3">
          <span>🎁 Gói quà miễn phí • 💌 Thiệp viết tay</span>
          <span className="ml-auto">📦 Giao nhanh trong ngày (nội thành)</span>
          <Link to="/orders" className="hover:underline text-white/90 hover:text-white">Tra cứu đơn</Link>
        </div>
      </div>

      <div className="container px-3 py-2.5 flex items-center gap-2">
        <button className="btn btn-ghost md:hidden p-2" onClick={() => setOpen(v => !v)} aria-label="Menu">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Gift Shop" className="h-9 w-9 object-contain" />
          <span className="hidden sm:inline text-lg font-extrabold text-rose-600">Gift Shop</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 ml-2">
          <NavA to="/" end>Trang chủ</NavA>
          <NavA to="/products">Sản phẩm</NavA>
          <NavA to="/products?cat=sinh-nhat">Sinh nhật</NavA>
          <NavA to="/products?cat=tinh-yeu">Tình yêu</NavA>
          <NavA to="/products?cat=combo-qua">Combo quà</NavA>
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden sm:flex items-center gap-2">
          <div className="relative">
            <input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm quà tặng..."
              className="w-60 rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 21-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/></svg>
            </span>
          </div>
          <button className="px-3.5 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700">Tìm</button>
        </form>

        <div className="hidden sm:flex items-center gap-1 ml-1">
          {!checking && (user ? (
            <div className="relative group">
              <button className="btn btn-ghost text-xs px-3 py-2">Xin chào, <strong>{user?.name || user?.email}</strong></button>
              <div className="absolute right-0 mt-1 w-44 bg-white border rounded-xl shadow-lg p-2 hidden group-hover:block">
                <Link to="/orders" className="block px-3 py-2 rounded hover:bg-rose-50 text-sm">Đơn hàng</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded hover:bg-rose-50 text-sm text-rose-600">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <>
              <Link className="text-sm px-2.5 py-1.5 rounded-lg hover:bg-rose-50" to="/login">Đăng nhập</Link>
              <Link className="text-sm px-3.5 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700" to="/signup">Đăng ký</Link>
            </>
          ))}
        </div>

        <Link to="/cart" className="relative ml-1 inline-flex items-center justify-center">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-400 hover:bg-rose-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </span>
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center">{itemCount}</span>
        </Link>
      </div>

      {open && (
        <div className="md:hidden border-t border-rose-100 bg-white">
          <div className="container px-3 py-2.5 space-y-2.5">
            <form onSubmit={onSearch} className="flex items-center gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} name="q" placeholder="Tìm quà tặng..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
              <button className="px-3.5 py-2.5 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700">Tìm</button>
            </form>

            <nav className="grid grid-cols-2 gap-2">
              <NavA to="/products?cat=gau-bong">Gấu bông</NavA>
              <NavA to="/products?cat=hoa-kho">Hoa khô</NavA>
              <NavA to="/products?cat=thiep">Thiệp</NavA>
              <NavA to="/products?cat=phu-kien">Phụ kiện</NavA>
              <NavA to="/products?cat=combo-qua">Combo quà</NavA>
              <NavA to="/orders">Tra cứu đơn</NavA>
            </nav>

            {!checking && (user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Xin chào, <strong>{user?.name || user?.email}</strong></span>
                <button className="px-3.5 py-2 rounded-lg bg-rose-600 text-white text-sm" onClick={handleLogout}>Đăng xuất</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link className="px-3 py-2 rounded-lg bg-slate-100 text-sm w-1/2 text-center" to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link>
                <Link className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm w-1/2 text-center" to="/signup" onClick={() => setOpen(false)}>Đăng ký</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
export default memo(Header);
