// frontend/src/features/admin/pages/products/ProductList.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import productService from "../../../../services/productService";
import { vnd } from "../../../../utils/format";

/* Ảnh có fallback SVG */
const Img = ({ src, alt, className }) => {
  const [ok, setOk] = useState(true);
  return (
    <img
      src={
        ok && src
          ? src
          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' rx='8' ry='8' fill='%23f1f5f9'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%2394a3b8'>No image</text></svg>"
      }
      onError={() => setOk(false)}
      alt={alt || ""}
      className={className}
    />
  );
};

/* Icon PNG */
const IconSearch = () => <img src="/src/assets/icon/seaching.png" alt="Tìm kiếm" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />;
const IconRefresh = () => <img src="/src/assets/icon/refresh.png" alt="Làm mới" className="w-4 h-4 inline-block mr-1" />;
const IconEdit = () => <img src="/src/assets/icon/edit.png" alt="Sửa" className="w-5 h-5 inline-block mr-1" />;
const IconDelete = () => <img src="/src/assets/icon/bin.png" alt="Xoá" className="w-5 h-5 inline-block mr-1" />;

/* Debounce */
function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ProductList() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const pageFromUrl = Number(sp.get("page") || 1);
  const qFromUrl = sp.get("q") || "";

  const [items, setItems] = useState([]);
  const [q, setQ] = useState(qFromUrl);
  const qDebounced = useDebounced(q);
  const [page, setPage] = useState(pageFromUrl);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await productService.list({
        page,
        limit,
        q: qDebounced,
        sort: "-createdAt",
        all: 1, // admin thấy cả tạm ẩn
      });
      const list = res?.items || res?.data || [];
      setItems(Array.isArray(list) ? list : []);
      setTotal(Number(res?.total) || list.length);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Không tải được sản phẩm");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, qDebounced]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Đồng bộ URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (qDebounced) params.set("q", qDebounced);
    if (page > 1) params.set("page", String(page));
    nav({ search: params.toString() }, { replace: true });
  }, [qDebounced, page, nav]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit]);
  const start = total ? (page - 1) * limit + 1 : 0;
  const end = total ? Math.min(page * limit, total) : 0;

  const removeItem = async (id) => {
    if (!window.confirm("Xoá sản phẩm này?")) return;
    try { await productService.remove(id); await fetchData(); }
    catch (e) { alert(e?.response?.data?.message || e.message || "Xoá thất bại"); }
  };

  const goto = (n) => setPage(Math.min(Math.max(1, n), totalPages));
  const pageNums = useMemo(() => {
    const arr = [];
    const startN = Math.max(1, page - 2);
    const endN = Math.min(totalPages, page + 2);
    for (let i = startN; i <= endN; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      {/* Thanh tiêu đề */}
      <div className="rounded-xl border bg-white px-4 py-3 flex flex-wrap items-center gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Quản lý</div>
          <h1 className="text-lg font-bold leading-tight">Sản phẩm</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <IconSearch />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên…"
              className="pl-8 pr-8 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 w-64"
            />
            {!!q && (
              <button
                type="button"
                onClick={() => { setQ(""); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Xoá tìm kiếm"
              >×</button>
            )}
          </div>
          <button onClick={fetchData} className="btn btn-outline flex items-center gap-1">
            <IconRefresh /> Làm mới
          </button>
          <Link to="/admin/products/new" className="btn btn-primary">+ Thêm sản phẩm</Link>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3 w-[88px]">Ảnh</th>
              <th className="p-3">Tên</th>
              <th className="p-3">Giá</th>
              <th className="p-3">Danh mục</th>
              <th className="p-3 w-36">Trạng thái</th>
              <th className="p-3 w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={"sk" + i} className="border-t">
                <td className="p-3"><div className="w-14 h-14 rounded bg-slate-100" /></td>
                <td className="p-3"><div className="h-4 w-48 bg-slate-100 rounded mb-1" /><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                <td className="p-3"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                <td className="p-3"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                <td className="p-3"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                <td className="p-3"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={6}>
                  Không có sản phẩm nào. Hãy{" "}
                  <Link to="/admin/products/new" className="text-rose-600 hover:underline">thêm sản phẩm</Link>.
                </td>
              </tr>
            )}

            {!loading && items.map((p) => {
              const img = Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh;
              const active = p.active !== false;
              return (
                <tr key={p._id} className="border-t hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="w-14 h-14 rounded overflow-hidden border bg-white">
                      <Img src={img} alt={p.ten} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="font-medium leading-tight">{p.ten}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p._id}</div>
                  </td>
                  <td className="p-3 align-top whitespace-nowrap">{vnd(p.gia)}</td>
                  <td className="p-3 align-top text-slate-600">{p.category?.name || p.categoryName || "-"}</td>
                  <td className="p-3 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs border ${
                      active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {active ? "Đang bán" : "Tạm ẩn"}
                    </span>
                  </td>
                  <td className="p-3 align-top flex items-center gap-2">
                    <Link
                      to={`/admin/products/${p._id}`}
                      title="Sửa sản phẩm"
                      className="px-2 py-1 rounded text-xs border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <IconEdit /> 
                    </Link>
                    <button
                      title="Xoá sản phẩm"
                      className="px-2 py-1 rounded text-xs border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1"
                      onClick={() => removeItem(p._id)}
                    >
                      <IconDelete /> 
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {total > 0 ? (
            <>Hiển thị <strong className="text-slate-800">{start}</strong>–<strong className="text-slate-800">{end}</strong> trong <strong className="text-slate-800">{total}</strong> sản phẩm</>
          ) : "Không có dữ liệu"}
        </div>

        {totalPages > 1 && (
          <div className="ml-auto flex items-center gap-1">
            <button className="btn" disabled={page <= 1} onClick={() => goto(page - 1)}>← Trước</button>
            {pageNums[0] > 1 && (
              <>
                <button className="btn" onClick={() => goto(1)}>1</button>
                {pageNums[0] > 2 && <span className="px-1">…</span>}
              </>
            )}
            {pageNums.map((n) => (
              <button key={n} onClick={() => goto(n)} className={`btn ${n === page ? "btn-primary" : ""}`}>{n}</button>
            ))}
            {pageNums.at(-1) < totalPages && (
              <>
                {pageNums.at(-1) < totalPages - 1 && <span className="px-1">…</span>}
                <button className="btn" onClick={() => goto(totalPages)}>{totalPages}</button>
              </>
            )}
            <button className="btn" disabled={page >= totalPages} onClick={() => goto(page + 1)}>Sau →</button>
          </div>
        )}
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
    </div>
  );
}
