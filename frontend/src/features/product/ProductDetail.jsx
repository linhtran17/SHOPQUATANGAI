import React from 'react';
import { vnd } from '../../utils/format';

const ProductDetail = ({ product }) => {
  if (!product) return <div>Đang tải…</div>;
  const img = Array.isArray(product.hinhAnh) ? product.hinhAnh[0] : product.hinhAnh;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <img src={img} alt={product.ten} className="w-full rounded-2xl object-cover border" />
      <div>
        <h1 className="text-2xl font-bold">{product.ten}</h1>
        <div className="mt-2 text-pink-600 text-xl font-extrabold">{vnd(product.gia)}</div>
        {product.moTa && <p className="mt-3 text-slate-700">{product.moTa}</p>}
      </div>
    </div>
  );
};
export default ProductDetail;
