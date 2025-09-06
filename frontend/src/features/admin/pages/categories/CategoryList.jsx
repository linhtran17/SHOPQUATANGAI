import React, { useEffect, useMemo, useState } from "react";
import categoryService from "../../../../services/categoryService";
import { toSlug } from "../../../../utils/slug";

/* Helpers */
function flatten(nodes, level = 0, chain = []) {
  return (nodes || []).flatMap((n) => {
    const cur = { ...n, _level: level, _chain: chain };
    return [cur, ...(Array.isArray(n.children) ? flatten(n.children, level + 1, [...chain, n._id]) : [])];
  });
}
function collectDescendantIds(node) {
  const ids = new Set();
  (function dfs(n){ ids.add(String(n._id)); (n.children||[]).forEach(dfs); })(node);
  return ids;
}

export default function CategoryList() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "", active: true });

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const data = await categoryService.tree({});
      setTree(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Không tải được danh mục");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const flat = useMemo(() => flatten(tree), [tree]);

  const excludedForParent = useMemo(() => {
    if (!editing) return new Set();
    const mine = flat.find((x) => String(x._id) === String(editing._id));
    return mine ? collectDescendantIds(mine) : new Set();
  }, [flat, editing]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await categoryService.create({
        name: form.name.trim(),
        slug: form.slug ? toSlug(form.slug) : undefined,
        parentId: form.parentId || undefined,
        active: !!form.active,
      });
      setForm({ name: "", slug: "", parentId: "", active: true });
      await load();
    } catch (e2) { alert(e2?.response?.data?.message || e2.message); }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    try {
      if (form.parentId && excludedForParent.has(String(form.parentId))) {
        alert("Không thể chọn cha là chính nó hoặc danh mục con."); return;
      }
      await categoryService.update(editing._id, {
        name: form.name.trim(),
        slug: form.slug ? toSlug(form.slug) : undefined,
        parentId: form.parentId || null,
        active: !!form.active,
      });
      setEditing(null);
      setForm({ name: "", slug: "", parentId: "", active: true });
      await load();
    } catch (e2) { alert(e2?.response?.data?.message || e2.message); }
  };

  const startEdit = (node) => {
    setEditing(node);
    setForm({ name: node.name || "", slug: node.slug || "", parentId: node.parentId || "", active: !!node.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleActive = async (node) => { await categoryService.updateActive(node._id, !node.active); await load(); };
  const onRemove = async (node) => {
    if (!window.confirm(`Xoá danh mục "${node.name}"?`)) return;
    try { await categoryService.remove(node._id); await load(); }
    catch (e) { alert(e?.response?.data?.message || e.message); }
  };

  if (loading) return <div>Đang tải…</div>;
  if (err) return <div className="text-rose-600">{err}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-2 text-lg font-semibold">Danh mục</div>
        <ul className="space-y-1">
          {tree.map((n) => (
            <TreeNode key={n._id} node={n} onEdit={startEdit} onToggle={toggleActive} onRemove={onRemove} />
          ))}
          {tree.length === 0 && <li className="text-slate-500">Chưa có danh mục</li>}
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold">{editing ? "Cập nhật danh mục" : "Thêm danh mục"}</div>
        <form className="space-y-3" onSubmit={editing ? onUpdate : onCreate}>
          <div>
            <label className="mb-1 block text-sm font-medium">Tên</label>
            <input
              className="block w-full rounded-lg border px-3 py-2"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: editing ? f.slug : toSlug(name) }));
              }}
              placeholder="Ví dụ: Hoa sinh nhật"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug (tuỳ chọn)</label>
            <input
              className="block w-full rounded-lg border px-3 py-2 font-mono"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="hoa-sinh-nhat"
            />
            <p className="mt-1 text-xs text-slate-500">Để trống để tự sinh theo tên.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Danh mục cha</label>
            <select
              className="block w-full rounded-lg border px-3 py-2"
              value={form.parentId || ""}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            >
              <option value="">— Không chọn —</option>
              {flat.map((n) => (
                <option key={n._id} value={n._id} disabled={editing && collectDescendantIds(editing).has(String(n._id))}>
                  {`${"— ".repeat(n._level)}${n.name}`}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            <span>Hiển thị</span>
          </label>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              {editing ? "Lưu thay đổi" : "Tạo"}
            </button>
            {editing && (
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => { setEditing(null); setForm({ name: "", slug: "", parentId: "", active: true }); }}
              >
                Huỷ
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function TreeNode({ node, onEdit, onToggle, onRemove, level = 0 }) {
  return (
    <li>
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{`${"— ".repeat(level)}${node.name}`}</div>
          <div className="text-xs text-slate-500">
            slug: <span className="font-mono">{node.slug || "(auto)"}</span> • Trạng thái: {node.active ? "Hiển thị" : "Ẩn"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50" onClick={() => onEdit(node)}>Sửa</button>
          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50" onClick={() => onToggle(node)}>
            {node.active ? "Ẩn" : "Hiện"}
          </button>
          <button className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50" onClick={() => onRemove(node)}>Xoá</button>
        </div>
      </div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <ul className="ml-4 mt-1 space-y-1">
          {node.children.map((ch) => (
            <TreeNode key={ch._id} node={ch} level={level + 1} onEdit={onEdit} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </li>
  );
}
