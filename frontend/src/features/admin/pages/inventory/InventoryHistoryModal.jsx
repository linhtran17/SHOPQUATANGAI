// src/features/admin/pages/inventory/InventoryHistoryModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import inventoryService from '../../../../services/inventoryService';

const TYPE_LABEL = {
  receive: 'Nhập',
  issue: 'Xuất',
  adjust: 'Điều chỉnh',
  stocktake: 'Kiểm kê',
  reserve: 'Giữ chỗ',
  release: 'Hủy giữ',
};

export default function InventoryHistoryModal({ item, onClose }) {
  const [loading, setLoading] = useState(false);
  const [moves, setMoves] = useState([]);
  const [type, setType] = useState('all');
  const [refKind, setRefKind] = useState('all');
  const [days, setDays] = useState(30);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    inventoryService.history(item.productId)
      .then(d => { if (!ignore) setMoves(d || []); })
      .finally(() => setLoading(false));
    return () => { ignore = true; };
  }, [item.productId]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const from = days === 'all' ? 0 : (now - Number(days) * 86400000);
    return moves.filter(m => {
      const okType = (type === 'all') || (m.type === type);
      const okRef  = (refKind === 'all') || ((m.ref?.kind || '') === refKind);
      const okTime = new Date(m.createdAt).getTime() >= from;
      return okType && okRef && okTime;
    });
  }, [moves, type, refKind, days]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={() => onClose()} />
      <div className="relative w-full max-w-4xl rounded-2xl border bg-white shadow-xl">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Lịch sử kho</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">Sản phẩm: {item.ten}</div>
          </div>
          <button onClick={() => onClose()} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Đóng">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select className="border rounded-lg px-3 py-1.5" value={type} onChange={e=>setType(e.target.value)}>
              <option value="all">Tất cả thao tác</option>
              <option value="receive">Nhập</option>
              <option value="issue">Xuất</option>
              <option value="adjust">Điều chỉnh</option>
              <option value="stocktake">Kiểm kê</option>
              <option value="reserve">Giữ chỗ</option>
              <option value="release">Hủy giữ</option>
            </select>
            <select className="border rounded-lg px-3 py-1.5" value={refKind} onChange={e=>setRefKind(e.target.value)}>
              <option value="all">Mọi nguồn</option>
              <option value="order">Đơn hàng</option>
              <option value="purchase">Phiếu nhập</option>
              <option value="return">Trả hàng</option>
              <option value="">Khác/Trống</option>
            </select>
            <select className="border rounded-lg px-3 py-1.5" value={days} onChange={e=>setDays(e.target.value)}>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
              <option value={'all'}>Tất cả</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="[&>th]:p-2 [&>th]:border-b text-left">
                  <th>Thời gian</th><th>Loại</th><th className="text-right">Qty</th>
                  <th className="text-right">ΔStock</th><th className="text-right">ΔReserved</th>
                  <th>Nguồn</th><th>Ghi chú</th><th>By</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="p-4 text-center text-slate-500">Đang tải...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-slate-500">Không có bản ghi</td></tr>}
                {!loading && filtered.map((m) => (
                  <tr key={m._id} className="[&>td]:p-2 [&>td]:border-b">
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs
                        ${m.type==='issue' ? 'bg-rose-100 text-rose-700' :
                          m.type==='receive' ? 'bg-emerald-100 text-emerald-700' :
                          m.type==='adjust' ? 'bg-amber-100 text-amber-700' :
                          m.type==='stocktake' ? 'bg-indigo-100 text-indigo-700' :
                          m.type==='reserve' ? 'bg-sky-100 text-sky-700' :
                          'bg-slate-100 text-slate-700'}`}>
                        {TYPE_LABEL[m.type] || m.type}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{m.qty}</td>
                    <td className="text-right tabular-nums">{m.deltaStock}</td>
                    <td className="text-right tabular-nums">{m.deltaReserved}</td>
                    <td className="truncate">{m.ref?.kind || ''}{m.ref?.id ? ` #${String(m.ref.id).slice(-6)}` : ''}</td>
                    <td className="truncate" title={m.note}>{m.note}</td>
                    <td className="truncate">{m.by || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
        <div className="p-3 border-t flex justify-end">
          <button onClick={() => onClose()} className="px-3 py-2 rounded-lg border hover:bg-slate-50">Đóng</button>
        </div>
      </div>
    </div>
  );
}
