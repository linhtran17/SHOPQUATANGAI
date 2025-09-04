// src/pages/CartPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { vnd } from '../utils/format';
import { useToast } from '../contexts/Toast';

export default function CartPage() {
  const nav = useNavigate();
  const { cart, loading, updateItem, removeItem, clear } = useCart();
  const notify = useToast();

  const onInc = (pid, current) => updateItem(pid, current + 1);
  const onDec = (pid, current) => updateItem(pid, Math.max(1, current - 1));
  const onQty = (pid, v) => {
    const n = Math.max(1, Number(v) || 1);
    updateItem(pid, n);
  };

  const handleCheckout = () => {
    if (!cart.items?.length) return;
    nav('/checkout');
  };

  if (loading) return <div>Đang tải giỏ hàng…</div>;

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold mb-4">Giỏ hàng</h1>

      {!cart.items?.length ? (
        <div className="p-6 bg-slate-50 rounded-lg">
          Giỏ hàng trống.{' '}
          <button className="btn btn-link" onClick={() => nav('/products')}>
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {cart.items.map((it) => {
              const p = it.product || {};
              const img = Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh;
              return (
                <div
                  key={it.productId}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <img
                    src={img}
                    alt={p.ten}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{p.ten}</div>
                    <div className="text-sm text-slate-500">{vnd(p.gia)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="btn btn-sm"
                        onClick={() => onDec(it.productId, it.qty)}
                      >
                        -
                      </button>
                      <input
                        className="w-16 text-center border rounded p-1"
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => onQty(it.productId, e.target.value)}
                      />
                      <button
                        className="btn btn-sm"
                        onClick={() => onInc(it.productId, it.qty)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {vnd((p.gia || 0) * (it.qty || 0))}
                    </div>
                    <button
                      className="text-red-600 text-sm mt-2"
                      onClick={() => {
                        removeItem(it.productId);
                        notify.warning({
                          title: 'Đã xóa sản phẩm khỏi giỏ hàng',
                          message: p.ten,
                          duration: 4000,
                        });
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              className="text-red-600"
              onClick={() => {
                clear();
                notify.warning({
                  title: 'Đã xóa toàn bộ giỏ hàng',
                  duration: 4000,
                });
              }}
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>

          <aside className="p-4 rounded-lg border h-fit">
            <div className="flex justify-between mb-2">
              <span>Tạm tính</span>
              <span className="font-semibold">{vnd(cart.subtotal)}</span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Phí vận chuyển & mã giảm sẽ áp ở bước tiếp theo.
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleCheckout}
            >
              Tiến hành thanh toán
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
