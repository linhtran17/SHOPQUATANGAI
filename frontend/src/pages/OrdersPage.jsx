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
  { key: "cancelled", label: "Đã huỷ" }, // gom cả cancelled + failed
];

const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const payableOf = (o) => Math.max(0, (o.tongTien||0) - (o.discountAmount||0) + (o.shippingFee||0));

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [tab, setTab]         = useState("all");
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.myOrders(); // có thể truyền {status: tab} nếu backend hỗ trợ
        // sort mới nhất -> cũ
        const sorted = (Array.isArray(data) ? data : []).sort((a,b) =>
          new Date(b.createdAt||0) - new Date(a.createdAt||0)
        );
        setOrders(sorted);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Không tải được danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Đếm số lượng theo trạng thái để show badge trên tab
  const counts = useMemo(() => {
    const c = { all: orders.length, pending:0, confirmed:0, shipping:0, delivered:0, cancelled:0 };
    for (const o of orders) {
      if (o.status === "pending")   c.pending++;
      else if (o.status === "confirmed") c.confirmed++;
      else if (o.status === "shipping")  c.shipping++;
      else if (o.status === "delivered") c.delivered++;
      else if (o.status === "failed" || o.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [orders]);

  // Lọc theo tab
  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    if (tab === "cancelled") return orders.filter(o => o.status === "cancelled" || o.status === "failed");
    return orders.filter(o => o.status === tab);
  }, [orders, tab]);

  // Trang hiện tại
  const visible = filtered.slice(0, PAGE_SIZE * page);
  const hasMore = visible.length < filtered.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-16 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (err) return <div className="text-rose-600">{err}</div>;

  if (!orders.length) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="text-lg font-semibold">Chưa có đơn hàng nào</div>
        <div className="mt-1 text-slate-600">Hãy chọn vài sản phẩm để bắt đầu nhé!</div>
        <Link
          to="/"
          className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Tra cứu đơn hàng</h1>

      {/* Tabs kiểu Shopee */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-xl border bg-white p-2 shadow-sm md:gap-3">
          {TABS.map(t => {
            const active = tab === t.key;
            const badgeCount = counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={[
                  "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                ].join(" ")}
              >
                <span>{t.label}</span>
                <span className={[
                  "inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                ].join(" ")}>
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách đơn – dạng list dọc (giống Shopee) */}
      <div className="space-y-4">
        {visible.map((o) => {
          const pay = payableOf(o);
          const items = Array.isArray(o.items) ? o.items : [];
          const first3 = items.slice(0, 3);
          const more = Math.max(0, items.length - 3);

          return (
            <div key={o._id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
              {/* Header card */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-slate-600 truncate">#{o._id}</div>
                  <div className="text-xs text-slate-500">{fmt(o.createdAt)}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(o.status)}`}>
                  {statusLabel(o.status)}
                </span>
              </div>

              <div className="border-t px-4 py-3">
                {/* Hàng thumbnail + tên sản phẩm */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {first3.map((it, i) => (
                      <img
                        key={i}
                        className="h-10 w-10 rounded-md object-cover ring-2 ring-white"
                        src={Array.isArray(it.hinhAnh) ? it.hinhAnh[0] : it.hinhAnh || ""}
                        alt={it.ten}
                        onError={(e)=>{ e.currentTarget.style.visibility='hidden'; }}
                      />
                    ))}
                    {more > 0 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-600 ring-2 ring-white">
                        +{more}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-700">
                      {items.map(it => it.ten).filter(Boolean).slice(0,3).join(", ")}
                      {more > 0 ? "…" : ""}
                    </div>
                    <div className="text-xs text-slate-500">
                      {items.reduce((s, it)=>s+(it.qty||0), 0)} sản phẩm
                    </div>
                  </div>

                  {/* Tổng thanh toán + CTA */}
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Tổng thanh toán</div>
                    <div className="text-base font-semibold">{vnd(pay)}</div>
                    <Link
                      to={`/orders/${o._id}`}
                      className="mt-1 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Pagination kiểu Shopee: nút “Tải thêm” */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Tải thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
