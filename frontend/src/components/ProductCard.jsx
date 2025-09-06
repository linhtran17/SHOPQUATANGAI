import React, { useState } from "react";
import { Link } from "react-router-dom";
import { vnd } from "../utils/format";
// import cartService from "../services/cartService"; // ✅ default import
import { useCart } from "../hooks/useCart";

export default function ProductCard({ p }) {
  

  const { addItem, isBusy } = useCart()

  const img =
    (Array.isArray(p?.hinhAnh) ? p?.hinhAnh?.[0] : p?.hinhAnh) ||
    "https://via.placeholder.com/640x800?text=No+Image";

  return (
    <article className="card card-hover group overflow-hidden">
      <div className="relative">
        <Link
          to={`/products/${p._id}`}
          className="block bg-pink-50/60 aspect-[4/5] overflow-hidden"
        >
          <img
            src={img}
            alt={p?.ten || "Sản phẩm"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="p-3 sm:p-4">
        <Link
          to={`/products/${p._id}`}
          className="line-clamp-2 font-semibold tracking-tight text-slate-900 hover:underline"
          title={p?.ten}
        >
          {p?.ten}
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="price">{vnd(p?.gia || 0)}</span>
          <div className="opacity-0 group-hover:opacity-100 transition">
            <button
              className="btn btn-primary"
              onClick={() => addItem(p)}
              disabled={isBusy}
            >
              {isBusy ? "Đang thêm..." : "Chọn quà này"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
