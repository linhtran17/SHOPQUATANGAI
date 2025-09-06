import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import orderService from "../services/orderService";
import { vnd } from "../utils/format";
import {
  statusLabel,
  statusClass,
  STATUS_FLOW,
  currentStepIndex,
} from "../utils/orderStatus";

/* ==== Icons (inline SVG – không cần lib) ==== */
const CartIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h8l3-7H6.4M7 13l-1.6-8M7 13l-2.2 4M17 13l2.2 4M7 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
  </svg>
);
const CheckClipboardIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      d="M9 4h6a2 2 0 0 1 2 2v1h-2.5a2.5 2.5 0 0 1-5 0H7V6a2 2 0 0 1 2-2Zm9 5v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9m4.5 5.5 1.5 1.5 3-3"/>
  </svg>
);
const TruckIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
  </svg>
);
const HomeCheckIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      d="M3 11 12 4l9 7v8a2 2 0 0 1-2 2h-4v-5a3 3 0 0 0-6 0v5H5a2 2 0 0 1-2-2zM9 14.5l1.5 1.5L14 12"/>
  </svg>
);
const XCircleIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="m9 9 6 6m0-6-6 6"/>
  </svg>
);

/* ==== Small helpers ==== */
const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const Chip = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className}`}>
    {children}
  </span>
);

/* ==== Stepper (KHÔNG dùng absolute đè chữ, không progress bar dài) ==== */
function Timeline({ order }) {
  const steps = useMemo(() => ([
    { key: "pending",   title: "Đã đặt hàng",       icon: <CartIcon className="h-4 w-4" />,      date: order?.createdAt },
    { key: "confirmed", title: "Đã xác nhận",       icon: <CheckClipboardIcon className="h-4 w-4" />, date: order?.confirmedAt },
    { key: "shipping",  title: "Đang giao hàng",    icon: <TruckIcon className="h-4 w-4" />,     date: order?.shippingAt },
    { key: "delivered", title: "Đã giao thành công",icon: <HomeCheckIcon className="h-4 w-4" />, date: order?.deliveredAt },
  ]), [order]);

  const active = currentStepIndex(order?.status);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold">Tiến trình đơn hàng</div>

      {/* Track + icons: dùng flex phân bổ đều, không absolute để khỏi chèn chữ */}
      <div className="px-1">
        <div className="mx-2 h-1 rounded-full bg-slate-200" />
        <div className="-mt-3 flex items-center justify-between">
          {steps.map((s, i) => {
            const state =
              i < active ? "done" : i === active && !["cancelled","failed"].includes(order?.status) ? "active" : "idle";
            const circleCls =
              state === "done"   ? "bg-emerald-500 text-white shadow" :
              state === "active" ? "bg-indigo-600 text-white shadow" :
                                   "bg-slate-200 text-slate-500";
            return (
              <div key={s.key} className="flex w-1/4 flex-col items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${circleCls}`}>
                  {s.icon}
                </div>
                <div className="min-h-[2.5rem] text-center">
                  <div className={`text-xs font-medium ${state !== "idle" ? "text-slate-900" : "text-slate-500"}`}>
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500">{fmt(s.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* trạng thái huỷ/thất bại */}
      {["cancelled","failed"].includes(order?.status) && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
          <XCircleIcon className="h-4 w-4" />
          <div className="text-xs">
            Đơn hàng {order?.status === "cancelled" ? "đã huỷ" : "giao thất bại"}.
            {order?.cancelReason && <> Lý do: <b>{order.cancelReason}</b></>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.detail(id);
        setOrder(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Không tải được đơn hàng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const payable = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, (order.tongTien || 0) - (order.discountAmount || 0) + (order.shippingFee || 0));
  }, [order]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />)}
        </div>
      </div>
    );
  }
  if (err) return <div className="text-rose-600">{err}</div>;
  if (!order) return <div>Không tìm thấy đơn hàng.</div>;

  return (
    <div className="space-y-6">
      {/* Header (KHÔNG có progress bar dài) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs/5 text-slate-300">Mã đơn</div>
            <div className="font-mono text-lg font-semibold tracking-wide">{order._id}</div>
          </div>
          <div className="flex items-center gap-2">
            <Chip className={`${statusClass(order.status)} bg-opacity-90 ring-white/0`}>{statusLabel(order.status)}</Chip>
            <Link
              to="/orders"
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15"
            >
              ← Danh sách đơn
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline – icon/label gọn, không chèn đè chữ */}
      <Timeline order={order} />

      {/* Info blocks */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Địa chỉ */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Thông tin nhận hàng</div>
          <div className="grid gap-1 text-sm break-words">
            <div>Họ tên: <b>{order?.thongTinNhanHang?.ten || "—"}</b></div>
            <div>SĐT: {order?.thongTinNhanHang?.sdt || "—"}</div>
            <div>Địa chỉ: {order?.thongTinNhanHang?.diaChi || "—"}</div>
            {order?.thongTinNhanHang?.ghiChu && <div>Ghi chú: {order.thongTinNhanHang.ghiChu}</div>}
          </div>
        </div>

        {/* Vận chuyển & thanh toán */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Vận chuyển & Thanh toán</div>
          <div className="grid gap-1 text-sm">
            <div>Phương thức: <b>{String(order?.paymentMethod || "COD").toUpperCase()}</b></div>
            <div>Phí vận chuyển: <b>{vnd(order?.shippingFee || 0)}</b></div>
            {order?.trackingCode && <div>Mã vận đơn: <span className="font-mono">{order.trackingCode}</span></div>}
          </div>
        </div>

        {/* Tổng thanh toán */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Tổng thanh toán</div>
          <div className="grid gap-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Tạm tính</span><span className="font-medium">{vnd(order.tongTien || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Giảm giá</span><span className="font-medium">- {vnd(order.discountAmount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Phí vận chuyển</span><span className="font-medium">+ {vnd(order.shippingFee || 0)}</span></div>
            <div className="mt-2 flex items-center justify-between border-t pt-2 text-base">
              <span className="font-semibold">Phải trả</span>
              <span className="text-lg font-bold">{vnd(Math.max(0, (order.tongTien || 0) - (order.discountAmount || 0) + (order.shippingFee || 0)))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sản phẩm */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="px-4 py-3 text-sm font-semibold">Sản phẩm</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>Sản phẩm</th>
                <th className="w-32">Giá</th>
                <th className="w-24">SL</th>
                <th className="w-40 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t">
              {order.items?.map((it, idx) => (
                <tr key={idx} className="[&>td]:px-4 [&>td]:py-3">
                  <td>
                    <div className="flex items-center gap-3">
                      {it.hinhAnh ? (
                        <img
                          src={Array.isArray(it.hinhAnh) ? it.hinhAnh[0] : it.hinhAnh}
                          alt={it.ten}
                          className="h-14 w-14 rounded object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded bg-slate-100 ring-1 ring-slate-200" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{it.ten}</div>
                        <div className="font-mono text-xs text-slate-500">{String(it.productId)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{vnd(it.gia || 0)}</td>
                  <td>{it.qty || 1}</td>
                  <td className="text-right">{vnd((it.gia || 0) * (it.qty || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div>Đặt lúc: {fmt(order.createdAt)}</div>
        <div>Cập nhật: {fmt(order.updatedAt)}</div>
      </div>
    </div>
  );
}
