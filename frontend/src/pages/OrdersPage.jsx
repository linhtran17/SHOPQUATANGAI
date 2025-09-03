import React, { useEffect, useState } from 'react';
import orderService from '../services/orderService';
import { vnd } from '../utils/format';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.myOrders(); // GET /api/orders
        setOrders(res.data || []);
      } catch (e) {
        setErr(e?.response?.data?.message || 'Không tải được danh sách đơn hàng.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Đang tải đơn hàng…</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!orders.length) return <div>Chưa có đơn hàng nào.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Đơn hàng của tôi</h1>
      <ul className="space-y-3">
        {orders.map(o => (
          <li key={o._id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{o._id}</div>
              <div className="text-sm text-slate-600">Trạng thái: {o.status}</div>
              <div className="text-sm text-slate-600">Tổng tiền: {vnd(o.tongTien || 0)}</div>
            </div>
            <Link className="btn btn-ghost" to={`/orders/${o._id}`}>Xem chi tiết</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
