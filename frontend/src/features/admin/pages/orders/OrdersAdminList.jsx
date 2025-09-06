import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import orderService from "../../../../services/orderService";
import { vnd } from "../../../../utils/format";
import { statusLabel, statusClass } from "../../../../utils/orderStatus";

const STATUS = [
  { value: "",            label: "Tất cả" },
  { value: "pending",     label: "Chờ xác nhận" },
  { value: "confirmed",   label: "Chờ lấy hàng" },
  { value: "shipping",    label: "Đang giao" },
  { value: "delivered",   label: "Đã giao" },
  { value: "failed",      label: "Giao thất bại" },
  { value: "cancelled",   label: "Đã huỷ" },
];

export default function OrdersAdminList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.limit || limit))),
    [data.total, data.limit, limit]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await orderService.adminList({ q, status, page, limit });
      setData(res);
    } catch (e) {
      console.error(e);
      setData({ items: [], total: 0, page: 1, limit });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [q, status, page, limit]);

  const doAction = async (action, id, confirmText) => {
    if (!window.confirm(confirmText)) return;
    try {
      setLoading(true);
      await orderService[action](id);
      await fetchData();
    } catch (e) {
      alert(e?.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Quản lý đơn hàng</h1>
            <p className="text-slate-500 text-sm">Xem, lọc và thao tác nhanh trên đơn.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border px-3 py-2 text-sm"
              title="Lọc trạng thái"
            >
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
                placeholder="Tìm mã đơn, tên KH, SĐT…"
                className="w-72 rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <svg className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.79L20 20.5L21.5 19zM10.5 15A4.5 4.5 0 1 1 15 10.5A4.505 4.505 0 0 1 10.5 15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>Mã đơn</th>
                <th className="w-48">Khách</th>
                <th className="w-28 text-right">Số dòng</th>
                <th className="w-40 text-right">Tổng thanh toán</th>
                <th className="w-40">Trạng thái</th>
                <th className="w-48">Thao tác</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Đang tải…</td>
                </tr>
              )}
              {!loading && (!data.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
              {!loading && data.items?.map((o) => {
                const itemCount =
                  o.itemsCount ??
                  (Array.isArray(o.items) ? o.items.reduce((s, it) => s + (it.qty || 0), 0) : 0);
                const totalPay =
                  o.payable ?? ((o.tongTien || 0) - (o.discountAmount || 0) + (o.shippingFee || 0));
                const shipInfo = o.shippingTo || o.thongTinNhanHang;

                return (
                  <tr key={o._id} className="[&>td]:px-4 [&>td]:py-3 hover:bg-slate-50">
                    <td className="font-mono text-xs">
                      <Link className="text-slate-900 underline-offset-2 hover:underline" to={`/admin/orders/${o._id}`}>
                        {o._id}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium">{shipInfo?.ten || "—"}</div>
                      <div className="text-xs text-slate-500">{shipInfo?.sdt || "—"}</div>
                    </td>
                    <td className="text-right tabular-nums">{itemCount}</td>
                    <td className="text-right tabular-nums">{vnd(totalPay)}</td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {o.status === "pending" && (
                          <button
                            className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => doAction("confirm", o._id, "Xác nhận đơn này?")}
                          >Xác nhận</button>
                        )}
                        {(o.status === "pending" || o.status === "confirmed") && (
                          <button
                            className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => doAction("fulfill", o._id, "Xuất kho & chuyển trạng thái đang giao?")}
                          >Xuất kho</button>
                        )}
                        {(o.status === "pending" || o.status === "confirmed") && (
                          <button
                            className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => doAction("cancel", o._id, "Huỷ đơn và nhả giữ chỗ?")}
                          >Huỷ</button>
                        )}
                        {o.status === "shipping" && (
                          <button
                            className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => doAction("delivered", o._id, "Đánh dấu đã giao?")}
                          >Đã giao</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 border-t bg-slate-50 px-3 py-3">
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang <strong>{page}</strong> / {totalPages}
          </span>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
