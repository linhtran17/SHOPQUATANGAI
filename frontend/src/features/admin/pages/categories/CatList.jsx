import React, { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { categoryApi } from '../../../../services/categoryService';

export default function CatList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', parentId: '', active: true });

  const load = async () => {
    setLoading(true); setErr('');
    try {
      // lấy dạng cây để hiển thị, có thể dùng list nếu muốn
      const tree = await categoryApi.tree({});
      setRows(tree || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Không tải được danh mục');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flatOptions = (nodes, level=0) => {
    return (nodes || []).flatMap(n => ([
      <option key={n._id} value={n._id}>{`${'— '.repeat(level)}${n.name}`}</option>,
      ...(Array.isArray(n.children) ? flatOptions(n.children, level+1) : [])
    ]));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    await api.post('/categories', {
      name: form.name,
      slug: form.slug || undefined,
      parentId: form.parentId || undefined,
      active: !!form.active
    });
    setForm({ name: '', slug: '', parentId: '', active: true });
    await load();
  };

  const onRemove = async (id) => {
    if (!confirm('Xoá danh mục?')) return;
    await api.delete(`/categories/${id}`);
    await load();
  };

  if (loading) return <div>Đang tải…</div>;
  if (err) return <div className="text-red-600">{err}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-lg font-bold mb-2">Danh mục</h1>
        <ul className="space-y-1">
          {rows.map(n => (
            <Node key={n._id} node={n} onRemove={onRemove} />
          ))}
          {!rows.length && <li className="text-slate-500">Chưa có danh mục</li>}
        </ul>
      </div>

      <form className="card p-3 space-y-3" onSubmit={onCreate}>
        <div className="font-semibold">Thêm danh mục</div>
        <div>
          <label className="text-sm font-medium">Tên</label>
          <input className="block w-full border rounded-lg px-3 py-2"
                 value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm font-medium">Slug (tuỳ chọn)</label>
          <input className="block w-full border rounded-lg px-3 py-2"
                 value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} />
        </div>
        <div>
          <label className="text-sm font-medium">Cha</label>
          <select className="block w-full border rounded-lg px-3 py-2"
                  value={form.parentId} onChange={e=>setForm({...form, parentId:e.target.value})}>
            <option value="">— Không chọn —</option>
            {flatOptions(rows)}
          </select>
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox"
                 checked={form.active}
                 onChange={e=>setForm({...form, active:e.target.checked})} />
          <span>Hiển thị</span>
        </label>
        <button className="btn btn-primary">Tạo</button>
      </form>
    </div>
  );
}

function Node({ node, level=0, onRemove }) {
  return (
    <li>
      <div className="flex items-center justify-between rounded-lg border p-2">
        <div>
          <div className="font-medium">{'— '.repeat(level)}{node.name}</div>
          <div className="text-xs text-slate-500">slug: {node.slug || '(auto)'}</div>
        </div>
        <button className="btn" onClick={() => onRemove(node._id)}>Xoá</button>
      </div>
      {Array.isArray(node.children) && node.children.length > 0 && (
        <ul className="ml-4 mt-1 space-y-1">
          {node.children.map(ch => (
            <Node key={ch._id} node={ch} level={level+1} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </li>
  );
}
