import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductDetail from '../features/product/ProductDetail';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await productService.detail(id);
        setProduct(data);
      } catch (e) {
        setErr(e?.response?.data?.message || 'Không tải được sản phẩm');
      }
    })();
  }, [id]);

  if (err) return <div className="text-red-600">{err}</div>;
  return <ProductDetail product={product} />;
}
