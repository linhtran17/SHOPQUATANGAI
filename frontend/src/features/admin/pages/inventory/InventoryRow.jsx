// src/features/admin/pages/inventory/InventoryRow.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { vnd } from '../../../../utils/format';

export default function InventoryRow({ item, onOpenAction }) {
  const available = Math.max(0, (item.stock || 0) - (item.reserved || 0));
  const warn = (item.stock < item.lowStockThreshold);

  const ActionBtn = ({ onClick, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:bg-slate-50 active:scale-[.99] transition"
    >
      {children}
    </button>
  );

  const pillMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  const Pill = ({ text, tone='slate' }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pillMap[tone] || pillMap.slate}`}>
      {text}
    </span>
  );

  return (
    <tr className="hover:bg-slate-50 transition">
      <td className="p-3 border-b align-top">
        <div className="flex gap-3 items-center">
          <img
            src={(item.hinhAnh?.[0]) || 'https://via.placeholder.com/64?text=No+Image'}
            alt=""
            className="w-12 h-12 rounded-lg object-cover border"
          />
          <div className="min-w-0">
            <Link to={`/admin/products/${item.productId}`} className="font-medium hover:underline truncate block">
              {item.ten}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Pill text={`Available: ${available}`} tone="emerald" />
              {warn && <Pill text="Dưới ngưỡng" tone="amber" />}
            </div>
          </div>
        </div>
      </td>

      <td className="p-3 border-b text-right tabular-nums">{vnd(item.gia)}</td>
      <td className="p-3 border-b text-right tabular-nums">{item.stock}</td>
      <td className="p-3 border-b text-right tabular-nums">{item.reserved}</td>
      <td className="p-3 border-b text-right tabular-nums">{available}</td>
      <td className="p-3 border-b text-right tabular-nums">{item.lowStockThreshold}</td>

      <td className="p-3 border-b">
        <div className="flex flex-wrap gap-2">
          <ActionBtn onClick={() => onOpenAction('receive', item)} title="Nhập">
            <Svg icon="in" /> <span>Nhập</span>
          </ActionBtn>
          <ActionBtn onClick={() => onOpenAction('issue', item)} title="Xuất">
            <Svg icon="out" /> <span>Xuất</span>
          </ActionBtn>
          <ActionBtn onClick={() => onOpenAction('adjust', item)} title="Điều chỉnh">
            <Svg icon="adjust" /> <span>Điều chỉnh</span>
          </ActionBtn>
          <ActionBtn onClick={() => onOpenAction('stocktake', item)} title="Kiểm kê">
            <Svg icon="stocktake" /> <span>Kiểm kê</span>
          </ActionBtn>
          <ActionBtn onClick={() => onOpenAction('threshold', item)} title="Đặt ngưỡng cảnh báo">
            <Svg icon="bell" /> <span>Ngưỡng</span>
          </ActionBtn>
          <ActionBtn onClick={() => onOpenAction('history', item)} title="Lịch sử kho">
            <Svg icon="history" /> <span>Lịch sử</span>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
}

function Svg({ icon, className = "w-4 h-4" }) {
  switch (icon) {
    case 'in':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>);
    case 'out':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21V9m0 0l4 4m-4-4l-4 4M4 3h16"/></svg>);
    case 'adjust':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 10h12M6 14h8"/><circle cx="8" cy="10" r="2"/><circle cx="14" cy="14" r="2"/></svg>);
    case 'stocktake':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7"/><path d="m15 18 2 2 4-4"/></svg>);
    case 'bell':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V10a6 6 0 0 0-12 0v4c0 .5-.2 1-.6 1.4L4 17h5"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
    case 'history':
      return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v5l3 3"/></svg>);
    default: return null;
  }
}
