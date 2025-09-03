import { useState, useCallback, useEffect } from "react";
import cartService from "../services/cartService";
import { useNotifications } from "../contexts/Toast";

const cartDefault = { items: [], subtotal: 0 };

export function useCart() {
  const [cart, setCart] = useState(cartDefault);
  const [loading, setLoading] = useState(true); // ✅ mặc định true để load lần đầu
  const [error, setError] = useState("");
  const [isBusy, setBusy] = useState(false);

  const { toastSuccess, toastError } = useNotifications();

  /** Lấy giỏ hàng */
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await cartService.getCart();
      const data = res?.data ?? {};
      setCart({
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: Number(data.subtotal) || 0,
      });
    } catch (e) {
      setCart(cartDefault);
      setError(
        e?.response?.data?.message || e.message || "Không tải được giỏ hàng"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /** Helper để wrap API call chung */
  const wrapAction = useCallback(
    async (apiCall, { successMsg, errorMsg } = {}) => {
      setBusy(true);
      try {
        await apiCall();
        if (successMsg) toastSuccess(successMsg);
        await fetchCart();
      } catch (e) {
        if (errorMsg) toastError(errorMsg);
      } finally {
        setBusy(false);
      }
    },
    [fetchCart, toastSuccess, toastError]
  );

  /** Các hành động trên cart */
  const addItem = useCallback(
    (product, qty = 1) =>
      wrapAction(
        () => cartService.addItem(product._id, qty),
        {
          successMsg: `Thêm thành công sản phẩm [${product?.ten || ""}]`,
          errorMsg: `Lỗi khi thêm sản phẩm [${product?.ten || ""}] vào giỏ hàng`,
        }
      ),
    [wrapAction]
  );

  const updateItem = useCallback(
    (productId, qty) =>
      wrapAction(() => cartService.updateItem(productId, qty), {
        errorMsg: "Cập nhật sản phẩm thất bại",
      }),
    [wrapAction]
  );

  const removeItem = useCallback(
    (productId) =>
      wrapAction(() => cartService.removeItem(productId), {
        errorMsg: "Xoá sản phẩm thất bại",
      }),
    [wrapAction]
  );

  const clear = useCallback(
    () =>
      wrapAction(() => cartService.clear(), {
        errorMsg: "Không thể xoá giỏ hàng",
      }),
    [wrapAction]
  );

  useEffect(() => {
    if (cart?.items.length == 0)
      fetchCart()
  }, [])

  return {
    cart,
    loading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clear,
    isBusy,
  };
}
