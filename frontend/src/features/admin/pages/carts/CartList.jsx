// src/features/admin/pages/carts/CartList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../../services/api";

export default function CartList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/cart/admin", { params: { minItems: 1 } });
      setRows(res.data || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 404
          ? "Backend chưa có API /cart/admin."
          : "Không tải được dữ liệu.");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="p-4">Đang tải…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Giỏ hàng của khách</h1>
          <p className="text-slate-500 text-sm">
            Xem các giỏ khách đang để – hỗ trợ theo dõi nhu cầu.
          </p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 rounded-lg border hover:bg-slate-50">
          Làm mới
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="font-medium mb-1">Lưu ý:</div>
          <div>{err}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 text-left text-sm">
            <tr className="[&>th]:p-3 [&>th]:border-b">
              <th>Người dùng</th>
              <th className="w-24 text-right">Số dòng</th>
              <th className="w-[50%]">Tóm tắt sản phẩm</th>
              <th className="w-48">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="p-3 border-b">
                  <div className="text-sm">
                    <span className="text-slate-500">userId:</span> <code>{r.userId}</code>
                  </div>
                </td>
                <td className="p-3 border-b text-right tabular-nums">{r.count ?? (r.items?.length || 0)}</td>
                <td className="p-3 border-b text-sm">
                  <div className="line-clamp-2">
                    {(r.items || []).slice(0,4).map((i, idx) => (
                      <span key={idx} className="mr-2">#{String(i.productId).slice(-5)}×{i.qty}</span>
                    ))}
                    {(r.items || []).length > 4 && <span>…</span>}
                  </div>
                </td>
                <td className="p-3 border-b text-sm">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}

            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">Chưa có giỏ hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
