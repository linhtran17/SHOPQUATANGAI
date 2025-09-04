import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import cartService from '../services/cartService';
import { useToast } from '../contexts/Toast';

const CartCtx = createContext(null);
const cartDefault = { items: [], subtotal: 0 };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(cartDefault);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBusy, setBusy] = useState(false);

  const toast = useToast();

  const fetchCart = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await cartService.getCart();
      const data = res?.data ?? {};
      setCart({
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: Number(data.subtotal) || 0,
      });
    } catch (e) {
      setCart(cartDefault);
      setError(e?.response?.data?.message || e.message || 'Không tải được giỏ hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (product, qty = 1) => {
    setBusy(true);
    try {
      const { status } = await cartService.addItem(product._id, qty);
      if (status === 201) toast.toastSuccess(`Đã thêm [${product?.ten || ''}]`);
      await fetchCart();
      window.dispatchEvent(new CustomEvent('cart:changed'));
    } catch {
      toast.toastError(`Thêm [${product?.ten || ''}] thất bại`);
    } finally {
      setBusy(false);
    }
  }, [fetchCart, toast]);

  const updateItem = useCallback(async (productId, qty) => {
    await cartService.updateItem(productId, qty);
    await fetchCart();
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }, [fetchCart]);

  const removeItem = useCallback(async (productId) => {
    await cartService.removeItem(productId);
    await fetchCart();
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }, [fetchCart]);

  const clear = useCallback(async () => {
    await cartService.clear();
    await fetchCart();
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }, [fetchCart]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  return (
    <CartCtx.Provider value={{ cart, loading, error, isBusy, fetchCart, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const v = useContext(CartCtx);
  if (!v) throw new Error('useCart must be used inside <CartProvider>');
  return v;
}
