import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '../services/orderService';
import { vnd } from '../utils/format';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.detail(id); // GET /api/orders/:id
        setOrder(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || 'Không tải được đơn hàng.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Đang tải…</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!order) return <div>Không tìm thấy đơn hàng.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Đơn hàng #{order._id}</h1>
      <div>Trạng thái: {order.status}</div>
      <div>Tổng tiền: {vnd(order.tongTien || 0)}</div>

      <div className="space-y-2 pt-2 border-t">
        {order.items?.map((it, idx) => (
          <div key={idx} className="border rounded p-2 flex items-center gap-3">
            <img
              src={Array.isArray(it.hinhAnh) ? it.hinhAnh[0] : it.hinhAnh}
              alt={it.ten}
              className="w-14 h-14 object-cover rounded"
            />
            <div className="flex-1">
              <div>{it.ten}</div>
              <div className="text-sm text-slate-600">x{it.qty} · {vnd(it.gia)}</div>
            </div>
            <div className="font-medium">{vnd((it.gia || 0) * (it.qty || 0))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
