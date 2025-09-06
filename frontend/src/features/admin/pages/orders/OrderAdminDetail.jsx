import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import orderService from "../../../../services/orderService";
import { vnd } from "../../../../utils/format";
import { statusLabel, statusClass } from "../../../../utils/orderStatus";

const Row = ({ label, children }) => (
  <div className="flex gap-3 py-1 text-sm">
    <div className="w-40 text-slate-500">{label}</div>
    <div className="flex-1">{children}</div>
  </div>
);

export default function OrderAdminDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await orderService.adminDetail(id);
      setOrder(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const payable = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, (order.tongTien || 0) - (order.discountAmount || 0) + (order.shippingFee || 0));
  }, [order]);

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải…</div>;
  if (!order) return <div className="p-6">Không tìm thấy đơn.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">Mã đơn</div>
          <div className="font-mono text-lg font-semibold">{order._id}</div>
          <div className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(order.status)}`}>
            {statusLabel(order.status)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["pending"].includes(order.status) && (
            <button
              disabled={busy}
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={() => act(() => orderService.confirm(order._id))}
            >Confirm</button>
          )}
          {["pending", "confirmed"].includes(order.status) && (
            <button
              disabled={busy}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              onClick={() => act(() => orderService.fulfill(order._id))}
            >Fulfill</button>
          )}
          {["pending", "confirmed"].includes(order.status) && (
            <button
              disabled={busy}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              onClick={() => act(() => orderService.cancel(order._id))}
            >Cancel</button>
          )}
          {["shipping"].includes(order.status) && (
            <button
              disabled={busy}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              onClick={() => act(() => orderService.delivered(order._id))}
            >Delivered</button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Người nhận</div>
          <Row label="Họ tên">{order?.thongTinNhanHang?.ten || "—"}</Row>
          <Row label="Điện thoại">{order?.thongTinNhanHang?.sdt || "—"}</Row>
          <Row label="Địa chỉ">{order?.thongTinNhanHang?.diaChi || "—"}</Row>
          {order?.thongTinNhanHang?.ghiChu && <Row label="Ghi chú">{order.thongTinNhanHang.ghiChu}</Row>}
        </div>

        <div className="rounded-xl border p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Thanh toán & vận chuyển</div>
          <Row label="Phương thức TT">{String(order.paymentMethod || "COD").toUpperCase()}</Row>
          <Row label="Phí vận chuyển">{vnd(order.shippingFee || 0)}</Row>
          <Row label="Shipment">
            {order.shipment ? (
              <div className="text-sm">
                <div>Mã VC: <span className="font-mono">{order.shipment.code}</span></div>
                <div>Phí: {vnd(order.shipment.fee || 0)}</div>
                <div>Trạng thái: {order.shipment.status || "created"}</div>
              </div>
            ) : (
              <div className="text-slate-500">Chưa tạo</div>
            )}
          </Row>
        </div>

        <div className="rounded-xl border p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Tổng tiền</div>
          <Row label="Tạm tính">{vnd(order.tongTien || 0)}</Row>
          <Row label="Giảm giá">- {vnd(order.discountAmount || 0)}</Row>
          <Row label="Phí ship">+ {vnd(order.shippingFee || 0)}</Row>
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <div className="font-semibold">Phải thu</div>
            <div className="text-lg font-bold">{vnd(payable)}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border shadow-sm">
        <div className="px-4 py-3 text-sm font-semibold">Sản phẩm</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>SP</th>
                <th className="w-32">Giá</th>
                <th className="w-24">SL</th>
                <th className="w-40 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t">
              {order.items?.map((it, idx) => (
                <tr key={idx} className="[&>td]:px-4 [&>td]:py-3">
                  <td>
                    <div className="font-medium">{it.ten}</div>
                    <div className="font-mono text-xs text-slate-500">{String(it.productId)}</div>
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

      <div className="rounded-xl border p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Thanh toán (nhật ký)</div>
        {order.payments?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr className="[&>th]:px-4 [&>th]:py-2">
                  <th>Provider</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody className="[&>tr]:border-t">
                {order.payments.map((p) => (
                  <tr key={p._id} className="[&>td]:px-4 [&>td]:py-2">
                    <td>{p.provider}</td>
                    <td>{p.status || "created"}</td>
                    <td>{vnd(p.amount || 0)}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Chưa có bản ghi thanh toán</div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link className="underline underline-offset-2" to="/admin/orders">
          « Quay lại danh sách
        </Link>
        <div>
          Tạo: {new Date(order.createdAt).toLocaleString()} — Cập nhật: {new Date(order.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
