// src/pages/OrdersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import orderService from "../services/orderService";
import { vnd } from "../utils/format";
import { statusLabel, statusClass } from "../utils/orderStatus";

const TABS = [
  { key: "all",       label: "Tất cả" },
  { key: "pending",   label: "Chờ xác nhận" },
  { key: "confirmed", label: "Chờ lấy hàng" },
  { key: "shipping",  label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" },
];

const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const payableOf = (o) =>
  Math.max(0, (o.tongTien || 0) - (o.discountAmount || 0) + (o.shippingFee || 0));

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 6;

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.myOrders();
        const sorted = (Array.isArray(data) ? data : []).sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setOrders(sorted);
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được danh sách đơn hàng."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const c = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      if (o.status === "pending") c.pending++;
      else if (o.status === "confirmed") c.confirmed++;
      else if (o.status === "shipping") c.shipping++;
      else if (o.status === "delivered") c.delivered++;
      else if (o.status === "failed" || o.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    if (tab === "cancelled")
      return orders.filter((o) => o.status === "cancelled" || o.status === "failed");
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  const visible = filtered.slice(0, PAGE_SIZE * page);
  const hasMore = visible.length < filtered.length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-28 rounded bg-slate-200" />
              <div className="mt-3 h-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (err) return <div className="text-rose-600">{err}</div>;

  if (!orders.length) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-lg">
        <div className="text-xl font-semibold">Chưa có đơn hàng nào</div>
        <div className="mt-2 text-slate-600">
          Hãy chọn vài sản phẩm để bắt đầu nhé!
        </div>
        <Link
          to="/"
          className="mt-5 inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-white shadow hover:scale-105 hover:opacity-90 transition"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <h1 className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-3xl font-extrabold text-transparent">
        Tra cứu đơn hàng
      </h1>

      {/* Tabs with sliding highlight */}
      <div className="relative overflow-x-auto">
        <div className="relative flex gap-2 rounded-2xl bg-slate-50 p-2 shadow-inner">
          {TABS.map((t, idx) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition
                            ${active ? "text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {t.label}
                <span className="ml-2 text-xs font-semibold">
                  ({counts[t.key]})
                </span>
              </button>
            );
          })}

          {/* highlight bg */}
          <div
            className="absolute top-2 bottom-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md transition-all duration-300"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translateX(${TABS.findIndex((t) => t.key === tab) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* Order list */}
      <div className="space-y-6">
        {visible.map((o) => {
          const pay = payableOf(o);
          const items = Array.isArray(o.items) ? o.items : [];
          const first3 = items.slice(0, 3);
          const more = Math.max(0, items.length - 3);

          return (
            <div
              key={o._id}
              className="group relative rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-100"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-slate-600">
                    #{o._id}
                  </div>
                  <div className="text-xs text-slate-500">{fmt(o.createdAt)}</div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-offset-1 shadow-sm transition-all group-hover:scale-105 ${statusClass(
                    o.status
                  )}`}
                >
                  {statusLabel(o.status)}
                </span>
              </div>

              {/* Content */}
              <div className="border-t px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Images */}
                  <div className="flex -space-x-3">
                    {first3.map((it, i) => (
                      <img
                        key={i}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-white shadow-sm transition group-hover:scale-110"
                        src={
                          Array.isArray(it.hinhAnh) ? it.hinhAnh[0] : it.hinhAnh || ""
                        }
                        alt={it.ten}
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ))}
                    {more > 0 && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 text-xs text-slate-600 ring-2 ring-white shadow-sm">
                        +{more}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {items
                        .map((it) => it.ten)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(", ")}
                      {more > 0 ? "…" : ""}
                    </div>
                    <div className="text-xs text-slate-500">
                      {items.reduce((s, it) => s + (it.qty || 0), 0)} sản phẩm
                    </div>
                  </div>

                  {/* Payment + CTA */}
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Tổng thanh toán</div>
                    <div className="text-lg font-bold text-slate-900">
                      {vnd(pay)}
                    </div>
                    <Link
                      to={`/orders/${o._id}`}
                      className="mt-2 inline-flex items-center rounded-lg border bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105 hover:opacity-90"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                setLoadingMore(true);
                setTimeout(() => {
                  setPage((p) => p + 1);
                  setLoadingMore(false);
                }, 800);
              }}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 hover:opacity-90"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Đang tải…
                </span>
              ) : (
                "Tải thêm"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
