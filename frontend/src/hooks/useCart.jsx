// src/hooks/useCart.js
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import cartService from '../services/cartService';
import { useNotifications } from '../contexts/Toast';

const CartContext = createContext();

const cartDefault = { items: [], subtotal: 0 }

export function CartProvider({ children }) {
  const [cart, setCart] = useState(cartDefault);
  const [loading, setLoading] = useState(true);   // ✅ mặc định true
  const [error, setError] = useState('');
  const [isBusy, setBusy] = useState(false);

  const mounted = useRef(true);

  const { toastSuccess, toastError } = useNotifications()
  const safe = useCallback((fn) => {
    if (mounted.current) fn();
  }, []);

  const fetchCart = useCallback(async () => {
    safe(() => { setLoading(true); setError(''); });
    try {
      const res = await cartService.getCart();
      const data = res?.data ?? {};
      safe(() => {
        setCart({
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal) || 0,
        });
      });
    } catch (e) {
      safe(() => {
        setCart(cartDefault);
        setError(e?.response?.data?.message || e.message || 'Không tải được giỏ hàng');
      });
    } finally {
      safe(() => setLoading(false));
    }
  }, [safe]);

  const afterChange = useCallback(() => {
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }, []);

  const addItem = useCallback(async (product, qty = 1) => {
    try {
      setBusy(true)
      const { status, data } = await cartService.addItem(product._id, qty);
      if (status === 201) {
        toastSuccess(`Thêm thành công sản phẩm [${product?.ten || ''}]`)
      }
      await fetchCart();
      afterChange();
    } catch (error) {
      toastError(`Lỗi khi thêm sản phẩm [${product?.ten || ''}] vào giỏ hàng`)
    } finally {
      setBusy(false)
    }
  }, [fetchCart, afterChange]);

  const updateItem = useCallback(async (productId, qty) => {
    await cartService.updateItem(productId, qty);
    await fetchCart();
    afterChange();
  }, [fetchCart, afterChange]);

  const removeItem = useCallback(async (productId) => {
    await cartService.removeItem(productId);
    await fetchCart();
    afterChange();
  }, [fetchCart, afterChange]);

  const clear = useCallback(async () => {
    await cartService.clear();
    await fetchCart();
    afterChange();
  }, [fetchCart, afterChange]);

  useEffect(() => {
    if (!mounted.current)
      fetchCart();
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return (
    <CartContext.Provider value={{ cart, loading, error, fetchCart, addItem, updateItem, removeItem, clear, isBusy }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
