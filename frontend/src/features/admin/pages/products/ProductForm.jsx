import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../../../services/productService';
import { categoryApi } from '../../../../services/categoryService';

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();

  const [cats, setCats] = useState([]);
  const [f, setF] = useState({
    ten: '', gia: 0, hinhAnh: '', categoryId: '', active: true,
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const t = await categoryApi.tree({ active: true });
        if (!ignore) setCats(t || []);
      } catch { /* ignore */ }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    (async () => {
      setLoading(true); setErr('');
      try {
        const res = await productService.detail(id);
        const p = res?.data || res; // service có thể trả data trực tiếp
        if (ignore) return;
        setF({
          ten: p.ten || '',
          gia: p.gia || 0,
          hinhAnh: (Array.isArray(p.hinhAnh) ? p.hinhAnh.join(',') : p.hinhAnh) || '',
          categoryId: p.categoryId || '',
          active: !!p.active,
        });
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.message || 'Không tải được chi tiết.');
      } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = {
        ...f,
        gia: Number(f.gia) || 0,
        hinhAnh: f.hinhAnh.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (id) await productService.update(id, payload);
      else await productService.create(payload);
      nav('/admin/products');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  const renderCatOptions = (nodes, level = 0) => {
    return (nodes || []).flatMap(n => ([
      <option key={n._id} value={n._id}>
        {`${'— '.repeat(level)}${n.name}`}
      </option>,
      ...(Array.isArray(n.children) ? renderCatOptions(n.children, level + 1) : [])
    ]));
  };

  if (loading) return <div>Đang tải…</div>;

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <h1 className="text-lg font-bold mb-2">{id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>

      <div>
        <label className="text-sm font-medium">Tên</label>
        <input className="block w-full border rounded-lg px-3 py-2"
               value={f.ten} onChange={e=>setF({...f, ten:e.target.value})} required />
      </div>

      <div>
        <label className="text-sm font-medium">Giá</label>
        <input type="number" min="0"
               className="block w-full border rounded-lg px-3 py-2 text-right"
               value={f.gia} onChange={e=>setF({...f, gia:e.target.value})} required />
      </div>

      <div>
        <label className="text-sm font-medium">Ảnh (ngăn cách bằng dấu phẩy)</label>
        <input className="block w-full border rounded-lg px-3 py-2"
               placeholder="https://..., /uploads/a.jpg, ..."
               value={f.hinhAnh} onChange={e=>setF({...f, hinhAnh:e.target.value})} />
      </div>

      <div>
        <label className="text-sm font-medium">Danh mục</label>
        <select className="block w-full border rounded-lg px-3 py-2"
                value={f.categoryId || ''} onChange={e=>setF({...f, categoryId:e.target.value})}>
          <option value="">— Không chọn —</option>
          {renderCatOptions(cats, 0)}
        </select>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={f.active} onChange={e=>setF({...f, active: e.target.checked})} />
        <span>Đang bán</span>
      </label>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="pt-2">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}
