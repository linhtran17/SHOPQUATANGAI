import React from "react";

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Doanh thu hôm nay", value: "₫0", note: "demo" },
          { label: "Đơn hàng mới", value: "0", note: "demo" },
          { label: "Khách đăng ký", value: "0", note: "demo" },
          { label: "Sản phẩm đang bán", value: "0", note: "demo" },
        ].map((c, i) => (
          <div key={i} className="card p-4">
            <div className="text-slate-500 text-xs">{c.label}</div>
            <div className="text-2xl font-extrabold mt-1">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 min-h-[220px]">
        <div className="font-semibold mb-2">Traffic (mock)</div>
        <div className="text-slate-500 text-sm">Sẽ gắn chart sau.</div>
      </div>
    </div>
  );
}
