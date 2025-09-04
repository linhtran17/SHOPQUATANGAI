import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { vnd } from '../utils/format';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page  = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = 12;

  // Các tham số lọc
  const q            = searchParams.get('q') || '';
  const categorySlug = searchParams.get('categorySlug') || '';

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', {
          params: {
            q,
            categorySlug,
            page,
            limit,
            sort: 'moiNhat',
          },
        });
        if (ignore) return;
        setItems(data?.items || []);
        setTotal(Number(data?.total || 0));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [q, categorySlug, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total]
  );

  const goPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h1 className="section-title">Tất cả sản phẩm</h1>

      {/* Summary */}
      {(q || categorySlug) && (
        <div className="mb-3 text-sm text-slate-600">
          {q && <>Từ khoá: <strong>{q}</strong> · </>}
          {categorySlug && <>Danh mục: <strong>{categorySlug}</strong> · </>}
          Tổng: <strong>{total}</strong> sản phẩm
        </div>
      )}

      {loading ? (
        <div>Đang tải…</div>
      ) : !items.length ? (
        <div className="p-6 bg-slate-50 rounded-2xl">
          Không tìm thấy sản phẩm phù hợp.
          <Link to="/products" className="btn ml-2">Xoá bộ lọc</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {items.map((p) => <ProductCard key={p._id} p={p} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                className="btn"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                ← Trước
              </button>
              <span className="text-sm">
                Trang <strong>{page}</strong> / {totalPages}
              </span>
              <button
                className="btn"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
