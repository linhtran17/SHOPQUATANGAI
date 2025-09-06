export const STATUS_TEXT = {
  pending:   "Chờ xác nhận",
  confirmed: "Chờ lấy hàng",
  shipping:  "Đang giao",
  delivered: "Đã giao",
  failed:    "Giao thất bại",
  cancelled: "Đã huỷ",
};

export function statusLabel(s) {
  return STATUS_TEXT[s] || s || "";
}

export function statusClass(s) {
  const map = {
    pending:   "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    confirmed: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
    shipping:  "bg-violet-100 text-violet-800 ring-1 ring-violet-200",
    delivered: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    failed:    "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
    cancelled: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  return map[s] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

// flow dùng để xác định bước hiện tại
export const STATUS_FLOW = ["pending", "confirmed", "shipping", "delivered"];
export function currentStepIndex(status) {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 ? i : 0;
}
