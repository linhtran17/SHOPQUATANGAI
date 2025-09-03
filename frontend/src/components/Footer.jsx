import React from "react";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-pink-100 bg-white">
      <div className="container grid gap-6 py-8 sm:grid-cols-3">
        <div>
          <div className="text-lg font-extrabold text-pink-600">🎁 Gift Shop</div>
          <p className="mt-2 text-sm text-slate-500">Quà xinh – Tình hồng gửi trao.</p>
        </div>
        <div>
          <div className="font-semibold">Hỗ trợ</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Chính sách đổi trả</li>
            <li>Vận chuyển & giao hàng</li>
            <li>Liên hệ</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Kết nối</div>
          <div className="mt-2 flex gap-2">
            <a className="btn" href="#"><span>🌐</span></a>
            <a className="btn" href="#"><span>🐦</span></a>
            <a className="btn" href="#"><span>📸</span></a>
          </div>
        </div>
      </div>
      <div className="border-t border-pink-100">
        <div className="container py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Gift Shop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
