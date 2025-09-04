import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../../../services/productService';
import { vnd } from '../../../../utils/format';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await productService.list({ limit: 50, sort: 'moiNhat' });
      const rows = res?.items || res?.data?.items || [];
      setItems(rows);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Không tải được danh sách.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRemove = async (id) => {
    if (!confirm('Xoá sản phẩm này?')) return;
    await productService.remove(id);
    await load();
  };

  if (loading) return <div>Đang tải…</div>;
  if (err) return <div className="text-red-600">{err}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold">Sản phẩm</h1>
        <Link className="btn btn-primary" to="/admin/products/new">+ Thêm</Link>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left p-2">Tên</th>
              <th className="text-right p-2">Giá</th>
              <th className="text-center p-2">Trạng thái</th>
              <th className="text-right p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p._id} className="border-t">
                <td className="p-2">{p.ten}</td>
                <td className="p-2 text-right">{vnd(p.gia)}</td>
                <td className="p-2 text-center">{p.active ? 'Đang bán' : 'Ẩn'}</td>
                <td className="p-2 text-right space-x-2">
                  <Link className="btn btn-outline" to={`/admin/products/${p._id}`}>Sửa</Link>
                  <button className="btn" onClick={() => onRemove(p._id)}>Xoá</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="p-3 text-center text-slate-500" colSpan={4}>Chưa có sản phẩm</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
