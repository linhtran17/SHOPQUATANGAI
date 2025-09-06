// frontend/src/features/admin/pages/products/ProductForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import productService from "../../../../services/productService";
import { categoryApi } from "../../../../services/categoryService";
import uploadService from "../../../../services/uploadService";
import { vnd } from "../../../../utils/format";

export default function ProductForm({ mode }) {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = mode ? mode === "edit" : Boolean(id);

  // -------------------- state --------------------
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr] = useState("");

  const [f, setF] = useState({
    ten: "", gia: "", moTa: "", categoryId: "", active: true,
  });
  const [cats, setCats] = useState([]);

  // ảnh đã upload (URL tuyệt đối)
  const [existingUrls, setExistingUrls] = useState([]);

  // upload ngay khi chọn
  const fileRef = useRef(null);
  const [pendingPreviews, setPendingPreviews] = useState([]); // [{url,name}]
  const [uploading, setUploading] = useState(false);

  // -------------------- data --------------------
  useEffect(() => {
    (async () => {
      try {
        const tree = await categoryApi.tree({ active: true });
        const flat = [];
        const walk = (arr, prefix = "") =>
          (arr || []).forEach(c => {
            const name = (prefix ? prefix + " / " : "") + (c.name || c.ten || "");
            flat.push({ _id: c._id, name });
            if (c.children?.length) walk(c.children, name);
          });
        walk(tree);
        setCats(flat);
      } catch {
        setCats([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    let stop = false;
    setLoading(true);
    (async () => {
      try {
        const data = await productService.detail(id);
        if (stop) return;
        setF({
          ten: data.ten || data.name || "",
          gia: data.gia ?? data.price ?? "",
          moTa: data.moTa || data.description || "",
          categoryId: data.categoryId || data.category?._id || "",
          active: data.active !== false,
        });
        const urls = Array.isArray(data.hinhAnh) ? data.hinhAnh : (data.hinhAnh ? [data.hinhAnh] : []);
        setExistingUrls(urls.filter(Boolean));
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Không tải được sản phẩm");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [isEdit, id]);

  // -------------------- image upload --------------------
  const openFileDialog = () => fileRef.current?.click();

  const handleFiles = async (files) => {
    if (!files?.length) return;
    const temps = [...files].map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPendingPreviews(prev => [...prev, ...temps]);
    try {
      setUploading(true);
      const urls = await uploadService.upload(files); // POST /api/uploads
      setExistingUrls(prev => [...prev, ...urls]);
    } catch (upErr) {
      setErr(upErr?.response?.data?.message || upErr.message || "Upload thất bại");
    } finally {
      temps.forEach(t => URL.revokeObjectURL(t.url));
      setPendingPreviews([]);
      setUploading(false);
    }
  };

  const onPickFiles = (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    handleFiles(files);
  };

  // drag & drop
  const [isDragging, setDragging] = useState(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles([...e.dataTransfer.files]);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const removeExisting = (idx) =>
    setExistingUrls(list => list.filter((_, i) => i !== idx));
  const makeCoverExisting = (idx) =>
    setExistingUrls(list => {
      if (idx <= 0) return list;
      const cp = [...list];
      const [x] = cp.splice(idx, 1);
      cp.unshift(x);
      return cp;
    });

  // -------------------- submit --------------------
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (uploading) { setErr("Đợi upload ảnh xong đã nhé!"); return; }
    try {
      setSaving(true);
      const payload = {
        ten: f.ten.trim(),
        gia: Number(f.gia) || 0,
        moTa: f.moTa,
        categoryId: f.categoryId || undefined,
        hinhAnh: existingUrls,
        active: !!f.active,
      };
      if (!payload.ten) throw new Error("Tên sản phẩm không được trống");
      if (payload.gia < 0) throw new Error("Giá phải ≥ 0");

      if (isEdit) await productService.update(id, payload);
      else await productService.create(payload);

      nav("/admin/products");
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  // -------------------- UI --------------------
  return (
    <form onSubmit={submit} className="relative max-w-6xl">
      {/* Sticky action bar */}
     {/* Header với nút Hủy/Lưu, không sticky */}
<div className="mb-4">
  <div className="rounded-xl border bg-white/90 px-3 py-2 flex items-center gap-2">
    <h1 className="text-3xl font-bold">{isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h1>
    {loading && <BadgeMuted text="Đang tải dữ liệu…" />}
    {uploading && <BadgeMuted text="Đang tải ảnh…" />}
    <div className="ml-auto flex items-center gap-2">
      <button type="button" onClick={() => nav(-1)}
        className="px-3 py-2 rounded-lg border hover:bg-slate-50 text-sm">
        Hủy
      </button>
      <button type="submit" disabled={saving || uploading}
        className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 text-sm">
        {saving ? "Đang lưu…" : "Lưu"}
      </button>
    </div>
  </div>
</div>


      {/* Form body */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: fields */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Thông tin cơ bản">
            <Label>Tên sản phẩm</Label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
              value={f.ten}
              onChange={(e) => setF({ ...f, ten: e.target.value })}
              required
            />
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div>
                <Label>Giá</Label>
                <input
                  type="number" min="0"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                  value={f.gia}
                  onChange={(e) => setF({ ...f, gia: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Xem trước: {vnd(f.gia || 0)}</p>
              </div>
              <div>
                <Label>Danh mục</Label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                  value={f.categoryId}
                  onChange={(e) => setF({ ...f, categoryId: e.target.value })}
                >
                  <option value="">— Chưa chọn —</option>
                  {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Mô tả">
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
              value={f.moTa}
              onChange={(e) => setF({ ...f, moTa: e.target.value })}
            />
          </Section>

          <Section title="Hình ảnh">
            {/* Uploader */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={
                "border-2 border-dashed rounded-2xl p-6 bg-white text-center transition " +
                (isDragging ? "border-rose-400 bg-rose-50/50" : "border-slate-200")
              }
            >
              <input
                ref={fileRef}
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                onChange={onPickFiles}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full p-2 border">
                  <IconUpload className="w-5 h-5" />
                </div>
                <div className="text-sm">
                  Kéo thả ảnh vào đây hoặc{" "}
                  <button type="button" onClick={openFileDialog} className="text-rose-600 hover:underline">
                    chọn từ máy
                  </button>
                </div>
                <div className="text-xs text-slate-500">Hỗ trợ nhiều ảnh (JPG/PNG/WebP). Ảnh đầu tiên là ảnh bìa.</div>
              </div>

              {/* đang upload → preview mờ */}
              {pendingPreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-1">Đang tải {pendingPreviews.length} ảnh…</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pendingPreviews.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p.url} alt="" className="w-24 h-24 rounded-xl object-cover bg-slate-100 opacity-60" />
                        <Spinner className="absolute inset-0 m-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* gallery */}
            {existingUrls.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-slate-600 mb-2">
                  Thư viện ({existingUrls.length})
                </div>
                <div className="flex flex-wrap gap-3">
                  {existingUrls.map((src, i) => (
                    <figure key={src + i} className="relative">
                      <img
                        src={src}
                        alt={`img-${i}`}
                        className="w-28 h-28 rounded-xl object-cover bg-slate-100 border"
                      />

                      {/* badge bìa */}
                      <figcaption className="absolute top-1 left-1">
                        <span className={"px-1.5 py-0.5 rounded text-[10px] " + (i === 0 ? "bg-rose-600 text-white" : "bg-black/60 text-white")}>
                          {i === 0 ? "Ảnh bìa" : "Ảnh"}
                        </span>
                      </figcaption>

                      {/* actions */}
                      <div className="absolute right-1 bottom-1 flex gap-1">
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={() => makeCoverExisting(i)}
                            className="px-1.5 py-0.5 rounded bg-white/90 text-xs border hover:bg-white"
                            title="Đặt làm bìa"
                          >
                            Bìa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExisting(i)}
                          className="px-1.5 py-0.5 rounded bg-red-600 text-white text-xs hover:bg-red-500"
                          title="Xoá ảnh"
                        >
                          Xoá
                        </button>
                      </div>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Right: status */}
        <div className="space-y-4">
          <Section title="Trạng thái">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!f.active}
                onChange={(e) => setF({ ...f, active: e.target.checked })}
              />
              <span>Đang bán</span>
            </label>
            <p className="text-xs text-slate-500 mt-2">Tắt để ẩn sản phẩm khỏi cửa hàng.</p>
          </Section>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

/* ---------- tiny UI helpers ---------- */
function Section({ title, children }) {
  return (
    <section className="rounded-2xl border bg-white p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Label({ children }) {
  return <label className="text-sm font-medium">{children}</label>;
}
function BadgeMuted({ text }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
      {text}
    </span>
  );
}
function Spinner({ className = "" }) {
  return (
    <svg className={"w-5 h-5 animate-spin text-rose-600 " + className} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
    </svg>
  );
}
function IconUpload({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <path d="M7 10l5-5 5 5M12 15V5"/>
    </svg>
  );
}
