// src/features/admin/pages/inventory/StockActionModal.jsx
import React, { useMemo, useState } from 'react';
import inventoryService from '../../../../services/inventoryService';

const TITLES = {
  receive: 'Nhập hàng',
  issue: 'Xuất hàng',
  adjust: 'Điều chỉnh tồn',
  stocktake: 'Kiểm kê (đặt lại tồn)',
  threshold: 'Đặt ngưỡng cảnh báo',
};

export default function StockActionModal({ action, item, onClose }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('increase'); // for adjust
  const [th, setTh] = useState(item.lowStockThreshold ?? 0);
  const [busy, setBusy] = useState(false);

  const stock = item.stock || 0;
  const reserved = item.reserved || 0;

  const { nextStock, canSubmit, warnMsg } = useMemo(() => {
    let ns = stock;
    if (action === 'receive') ns = stock + qty;
    if (action === 'issue')   ns = stock - qty;
    if (action === 'adjust')  ns = stock + (mode === 'increase' ? qty : -qty);
    if (action === 'stocktake') ns = qty; // đặt lại
    const ok = ns >= 0;
    const msg = ok ? '' : 'Số lượng thao tác sẽ làm tồn kho âm.';
    return { nextStock: ns, canSubmit: ok, warnMsg: msg };
  }, [action, qty, mode, stock]);

  const needNote = (action === 'adjust' || action === 'stocktake');
  const noteInvalid = needNote && String(note).trim().length < 3;

  const step = (delta) => setQty((q) => Math.max(1, q + delta));

  const submit = async () => {
    try {
      if (!canSubmit) return;
      if (noteInvalid && action !== 'threshold') return;
      setBusy(true);
      const pid = item.productId;
      if (action === 'receive')        await inventoryService.receive(pid, qty, note);
      else if (action === 'issue')     await inventoryService.issue(pid, qty, note);
      else if (action === 'adjust')    await inventoryService.adjust(pid, mode, qty, note);
      else if (action === 'stocktake') await inventoryService.stocktake(pid, qty, note);
      else if (action === 'threshold') await inventoryService.updateThreshold(pid, th);
      onClose(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={() => !busy && onClose(false)} />
      {/* card */}
      <div className="relative w-full max-w-lg rounded-2xl border bg-white shadow-xl">
        {/* header */}
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{TITLES[action] || 'Thao tác'}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">Sản phẩm: {item.ten}</div>
          </div>
          <button
            onClick={() => onClose(false)}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          </button>
        </div>

        {/* body */}
        <div className="p-4 space-y-4">
          {action === 'adjust' && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                onClick={() => setMode('increase')}
                className={`px-3 py-2 rounded-lg border ${mode==='increase' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'hover:bg-slate-50'}`}
              >
                Tăng (+)
              </button>
              <button
                onClick={() => setMode('decrease')}
                className={`px-3 py-2 rounded-lg border ${mode==='decrease' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'hover:bg-slate-50'}`}
              >
                Giảm (−)
              </button>
            </div>
          )}

          {action !== 'threshold' ? (
            <>
              <label className="block text-sm">
                Số lượng
                <div className="mt-1 flex items-stretch rounded-lg border overflow-hidden w-full">
                  <button type="button" onClick={() => step(-1)} className="px-3 hover:bg-slate-50">−</button>
                  <input
                    type="number" min={1} value={qty}
                    onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                    className="flex-1 text-center outline-none"
                  />
                  <button type="button" onClick={() => step(1)} className="px-3 hover:bg-slate-50">+</button>
                </div>
              </label>

              <label className="block text-sm">
                Ghi chú {needNote && <span className="text-rose-600">*</span>}
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={action==='receive' ? 'VD: nhập lô 09/2025' : 'Ghi chú...'}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${noteInvalid ? 'border-rose-300 ring-rose-200' : 'focus:ring-rose-500/40'}`}
                />
                {noteInvalid && <div className="text-xs text-rose-600 mt-1">Vui lòng nhập ghi chú (≥ 3 ký tự).</div>}
              </label>

              {/* preview */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="Tồn hiện tại" value={stock} />
                <Stat label="Giữ chỗ" value={reserved} />
                <Stat label="Tồn sau thao tác" value={nextStock} highlight />
              </div>

              {!canSubmit && (
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                  {warnMsg}
                </div>
              )}
            </>
          ) : (
            <label className="block text-sm">
              Ngưỡng cảnh báo
              <input
                type="number" min={0} value={th}
                onChange={e => setTh(Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </label>
          )}
        </div>

        {/* footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={() => onClose(false)}
            disabled={busy}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={busy || (!canSubmit && action !== 'threshold') || (noteInvalid && action !== 'threshold')}
            className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 shadow-sm active:scale-[.99] disabled:opacity-60"
          >
            {busy ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight=false }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
