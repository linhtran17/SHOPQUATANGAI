// src/features/admin/pages/inventory/InventoryList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import inventoryService from '../../../../services/inventoryService';
import InventoryRow from './InventoryRow';
import StockActionModal from './StockActionModal';
import InventoryHistoryModal from './InventoryHistoryModal';
import { exportCsv, makeCsvFilename } from '../../../../utils/exportCsv';
import { useToast } from '../../../../contexts/Toast';
import { vnd } from '../../../../utils/format';

export default function InventoryList() {
  const { toastSuccess, toastError } = useToast();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({ total: 0, items: [] });
  const [sum, setSum] = useState({
    totalSku: 0,
    totalStock: 0,
    totalReserved: 0,
    totalAvailable: 0,
    lowCount: 0,
  });

  const [modal, setModal] = useState({ open: false, action: null, item: null });
  const [history, setHistory] = useState({ open: false, item: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1) Gọi list trước (để có dữ liệu hiển thị + fallback KPI)
      const d = await inventoryService.list({ q, page, limit, low: lowOnly ? 1 : 0 });
      setData(d);

      // 2) Gọi summary (KPI tổng DB); nếu lỗi → tự tính từ trang hiện tại
      try {
        const s = await inventoryService.summary({ q, low: lowOnly ? 1 : 0 });
        setSum(s || { totalSku: 0, totalStock: 0, totalReserved: 0, totalAvailable: 0, lowCount: 0 });
      } catch {
        const items = d.items || [];
        const totalSku       = items.length;
        const totalStock     = items.reduce((a, x) => a + (x.stock || 0), 0);
        const totalReserved  = items.reduce((a, x) => a + (x.reserved || 0), 0);
        const totalAvailable = items.reduce((a, x) => a + Math.max(0, (x.stock || 0) - (x.reserved || 0)), 0);
        const lowCount       = items.reduce((a, x) => a + ((x.stock || 0) < (x.lowStockThreshold || 0) ? 1 : 0), 0);
        setSum({ totalSku, totalStock, totalReserved, totalAvailable, lowCount });
        // Có thể báo nhẹ nếu muốn:
        // toastError('Không lấy được KPI tổng, đang hiển thị theo trang hiện tại');
      }
    } catch (e) {
      toastError('Không tải được dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [q, page, limit, lowOnly]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / limit));
  const openAction = (action, item) => setModal({ open: true, action, item });
  const closeModal = (changed = false) => {
    setModal({ open: false, action: null, item: null });
    if (changed) { toastSuccess('Cập nhật tồn kho thành công'); fetchData(); }
  };
  const openHistory = (item) => setHistory({ open: true, item });
  const closeHistory = () => setHistory({ open: false, item: null });

  const exportView = () => {
    if (!data.items?.length) {
      toastError('Không có dữ liệu để xuất');
      return;
    }
    // Tổng theo view hiện tại
    const totalStock     = data.items.reduce((a, x) => a + (x.stock || 0), 0);
    const totalReserved  = data.items.reduce((a, x) => a + (x.reserved || 0), 0);
    const totalAvailable = data.items.reduce((a, x) => a + Math.max(0, (x.stock || 0) - (x.reserved || 0)), 0);

    const columns = [
      { label: 'STT',              value: (_row, idx) => idx + 1 },
      { label: 'Tên sản phẩm',     key: 'ten' },
      { label: 'Giá bán (VND)',    value: (r) => vnd(r.gia) },
      { label: 'Tồn',              key: 'stock' },
      { label: 'Giữ chỗ',          key: 'reserved' },
      { label: 'Khả dụng',         value: (r) => Math.max(0, (r.stock || 0) - (r.reserved || 0)) },
      { label: 'Ngưỡng cảnh báo',  key: 'lowStockThreshold' },
    ];

    const summaryRow = ['', 'TỔNG', '', totalStock, totalReserved, totalAvailable, ''];

    exportCsv(makeCsvFilename('ton-kho'), data.items, {
      columns,
      delimiter: ';',
      summaryRow,
    });
    toastSuccess('Đã xuất CSV (tiếng Việt)');
  };

  const kpi = useMemo(() => ([
    { label: 'Tổng SKU',   val: sum.totalSku },
    { label: 'Tồn hiện tại', val: sum.totalStock },
    { label: 'Giữ chỗ',    val: sum.totalReserved },
    { label: 'Khả dụng',   val: sum.totalAvailable },
    { label: 'Dưới ngưỡng', val: sum.lowCount },
  ]), [sum]);

  return (
    <div className="space-y-5">
      {/* Header + KPI */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Quản lý tồn kho</h1>
              <p className="text-slate-500 text-sm">Theo dõi tồn, cảnh báo sắp hết và thao tác nhập/xuất/kiểm kê.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full border hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="accent-rose-600"
                  checked={lowOnly}
                  onChange={(e) => { setPage(1); setLowOnly(e.target.checked); }}
                />
                <span>Chỉ hiển thị dưới ngưỡng</span>
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-1.06 1.06l.27.28v.79L20 20.5 21.5 19zM10.5 15A4.5 4.5 0 1 1 15 10.5 4.5 4.5 0 0 1 10.5 15"></path>
                  </svg>
                </span>
                <input
                  value={q}
                  onChange={(e) => { setPage(1); setQ(e.target.value); }}
                  placeholder="Tìm theo tên sản phẩm..."
                  className="pl-10 pr-3 py-2 w-72 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <button onClick={exportView} className="px-3 py-2 rounded-lg border hover:bg-slate-50">
                Export CSV
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {kpi.map((x, i) => (
              <div key={i} className="p-3 rounded-xl border bg-slate-50">
                <div className="text-xs text-slate-500">{x.label}</div>
                <div className="text-lg font-semibold tabular-nums">{x.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 sticky top-0 text-left text-sm">
              <tr className="[&>th]:p-3 [&>th]:border-b">
                <th>Sản phẩm</th>
                <th className="w-28 text-right">Giá</th>
                <th className="w-24 text-right">Tồn</th>
                <th className="w-24 text-right">Giữ chỗ</th>
                <th className="w-24 text-right">Available</th>
                <th className="w-32 text-right">Ngưỡng</th>
                <th className="w-[470px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="[&>td]:p-3 [&>td]:border-b">
                  <td colSpan={7}>
                    <div className="h-5 w-full animate-pulse bg-slate-100 rounded" />
                  </td>
                </tr>
              ))}
              {!loading && data.items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              )}
              {!loading && data.items?.map((item) => (
                <InventoryRow
                  key={item.productId}
                  item={item}
                  onOpenAction={(action, it) => action === 'history' ? openHistory(it) : openAction(action, it)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50">
          <div className="text-sm text-slate-600">
            {data.total > 0 && (
              <>Hiển thị <strong>{(page - 1) * limit + 1}</strong>–<strong>{Math.min(page * limit, data.total)}</strong> / {data.total}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-2 py-1.5 rounded-lg border bg-white"
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
            >
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
            <button
              className="px-3 py-1.5 rounded-lg border hover:bg-white disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <span className="text-sm text-slate-600">
              Trang <strong>{page}</strong> / {Math.max(1, Math.ceil((data.total || 0) / limit))}
            </span>
            <button
              className="px-3 py-1.5 rounded-lg border hover:bg-white disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.open && (
        <StockActionModal action={modal.action} item={modal.item} onClose={closeModal} />
      )}
      {history.open && (
        <InventoryHistoryModal item={history.item} onClose={closeHistory} />
      )}
    </div>
  );
}
