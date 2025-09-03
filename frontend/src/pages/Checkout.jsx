// src/pages/Checkout.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import orderService from '../services/orderService';
import discountService from '../services/discountService';
import { vnd } from '../utils/format';

export default function Checkout() {
  const nav = useNavigate();
  const { cart, loading } = useCart();

  // ====== Thông tin nhận hàng ======
  const [receiver, setReceiver] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [note, setNote] = useState('');
  const firstInvalidRef = useRef(null);

  // ====== Mã giảm / Freeship / Phí ship ======
  const [discountCode, setDiscountCode] = useState('');
  const [shipCode, setShipCode] = useState('');
  const [shippingFee, setShippingFee] = useState(0);

  // Ước tính theo server
  const [orderPreview, setOrderPreview] = useState(0);
  const [shipPreview, setShipPreview] = useState(0);
  const [serverTotal, setServerTotal] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [quoting, setQuoting] = useState(false);

  // ====== Thanh toán ======
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const subtotal = Number(cart?.subtotal || 0);
  const ship = Number(shippingFee) || 0;

  const canPlace = useMemo(() => {
    const hasItems = (cart?.items?.length || 0) > 0;
    const requiredOk =
      receiver.trim() &&
      phone.trim() &&
      addressLine.trim() &&
      district.trim() &&
      province.trim();
    return hasItems && requiredOk;
  }, [receiver, phone, addressLine, district, province, cart]);

  // Quay lại giỏ nếu rỗng
  useEffect(() => {
    if (!loading && (!cart?.items || cart.items.length === 0)) {
      nav('/cart', { replace: true });
    }
  }, [loading, cart, nav]);

  // Gợi ý mã (public)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await discountService.available(subtotal, ship);
        if (!ignore) setSuggestions(res.data?.items || []);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    })();
    return () => { ignore = true; };
  }, [subtotal, ship]);

  // Quote tổng theo server
  useEffect(() => {
    let ignore = false;
    setQuoting(true);
    (async () => {
      try {
        const { data } = await discountService.quote({
          subtotal,
          shippingFee: ship,
          discountCode: discountCode.trim() || undefined,
          freeShipCode: shipCode.trim() || undefined,
        });
        if (ignore) return;
        setOrderPreview(Number(data?.order?.discount || 0));
        setShipPreview(Number(data?.shipping?.discount || 0));
        setServerTotal(Number(data?.total || (subtotal + ship)));
      } catch {
        if (!ignore) {
          setOrderPreview(0);
          setShipPreview(0);
          setServerTotal(subtotal + ship);
        }
      } finally {
        if (!ignore) setQuoting(false);
      }
    })();
    return () => { ignore = true; };
  }, [subtotal, ship, discountCode, shipCode]);

  // Simple validate + scroll first invalid
  const validateRequired = () => {
    const next = {
      receiver: !receiver.trim() ? 'Vui lòng nhập họ tên người nhận' : '',
      phone:
        !phone.trim() ? 'Vui lòng nhập số điện thoại' :
        !/^[0-9\-+() ]{8,15}$/.test(phone.trim()) ? 'Số điện thoại không hợp lệ' : '',
      addressLine: !addressLine.trim() ? 'Vui lòng nhập địa chỉ' : '',
      district: !district.trim() ? 'Vui lòng nhập quận/huyện' : '',
      province: !province.trim() ? 'Vui lòng nhập tỉnh/thành' : '',
    };
    setFieldErr(next);

    const firstKey = Object.keys(next).find(k => next[k]);
    if (firstKey && firstInvalidRef.current) {
      firstInvalidRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.values(next).every(v => !v);
  };

  const handlePlaceOrder = async () => {
    if (placing) return;
    setErr('');
    if (!validateRequired()) return;

    setPlacing(true);
    try {
      const payload = {
        paymentMethod,
        address: {
          ten: receiver,
          sdt: phone,
          diaChi: [addressLine, ward, district, province].filter(Boolean).join(', '),
          ghiChu: note,
          ward, district, province, address_line: addressLine,
        },
        shippingFee: ship, // server tự trừ freeship nếu có
      };
      if (discountCode.trim()) payload.discountCode = discountCode.trim().toUpperCase();
      if (shipCode.trim()) payload.freeShipCode = shipCode.trim().toUpperCase();

      const res = await orderService.create(payload);
      const order = res.data;
      if (order?._id) nav(`/orders/${order._id}`);
      else nav('/orders');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Tạo đơn thất bại. Vui lòng thử lại.';
      setErr(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div>Đang tải giỏ hàng…</div>;

  // --- UI helpers ---
  const labelCls = "text-sm font-medium text-slate-700";
  const inputCls = "block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200";
  const invalidCls = "border-red-300 focus:border-red-400 focus:ring-red-200";
  const helpCls = "mt-1 text-xs";
  const chipBase = "px-3 py-1.5 rounded-full border text-xs transition";
  const chipOn = "bg-rose-600 border-rose-600 text-white";
  const chipOff = "bg-white border-slate-200 hover:bg-rose-50 text-slate-700";

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold mb-4">Thanh toán</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* ===== Thông tin nhận hàng ===== */}
        <section className="p-5 rounded-2xl border bg-white space-y-4">
          <h2 className="font-semibold text-slate-900">Thông tin nhận hàng</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div ref={firstInvalidRef}>
              <label className={labelCls}>Họ tên người nhận <span className="text-rose-600">*</span></label>
              <input
                className={`${inputCls} ${fieldErr.receiver ? invalidCls : ''}`}
                placeholder="VD: Nguyễn Văn A"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                aria-invalid={!!fieldErr.receiver}
              />
              {fieldErr.receiver && <div className={`${helpCls} text-red-600`}>{fieldErr.receiver}</div>}
            </div>

            <div>
              <label className={labelCls}>Số điện thoại <span className="text-rose-600">*</span></label>
              <input
                className={`${inputCls} ${fieldErr.phone ? invalidCls : ''}`}
                placeholder="VD: 09xx xxx xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!fieldErr.phone}
              />
              {fieldErr.phone && <div className={`${helpCls} text-red-600`}>{fieldErr.phone}</div>}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Địa chỉ (số nhà, đường) <span className="text-rose-600">*</span></label>
              <input
                className={`${inputCls} ${fieldErr.addressLine ? invalidCls : ''}`}
                placeholder="VD: 123 Nguyễn Trãi"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                aria-invalid={!!fieldErr.addressLine}
              />
              {fieldErr.addressLine && <div className={`${helpCls} text-red-600`}>{fieldErr.addressLine}</div>}
            </div>

            <div>
              <label className={labelCls}>Phường/Xã (tuỳ chọn)</label>
              <input
                className={inputCls}
                placeholder="VD: Phường 7"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>Quận/Huyện <span className="text-rose-600">*</span></label>
              <input
                className={`${inputCls} ${fieldErr.district ? invalidCls : ''}`}
                placeholder="VD: Quận 5"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                aria-invalid={!!fieldErr.district}
              />
              {fieldErr.district && <div className={`${helpCls} text-red-600`}>{fieldErr.district}</div>}
            </div>

            <div>
              <label className={labelCls}>Tỉnh/Thành phố <span className="text-rose-600">*</span></label>
              <input
                className={`${inputCls} ${fieldErr.province ? invalidCls : ''}`}
                placeholder="VD: TP. Hồ Chí Minh"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                aria-invalid={!!fieldErr.province}
              />
              {fieldErr.province && <div className={`${helpCls} text-red-600`}>{fieldErr.province}</div>}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Ghi chú (tuỳ chọn)</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-y`}
                placeholder="Lưu ý cho shipper, khung giờ nhận..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Thanh toán */}
          <div className="pt-3 border-t space-y-2">
            <div className="text-sm font-medium">Phương thức thanh toán</div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:bg-rose-50">
                <input type="radio" name="pm" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:bg-rose-50">
                <input type="radio" name="pm" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                <span>Ví MoMo (mock)</span>
              </label>
            </div>
          </div>

          {err && <div className="text-red-600 text-sm">{err}</div>}
        </section>

        {/* ===== Tóm tắt đơn & voucher ===== */}
        <aside className="p-5 rounded-2xl border h-fit space-y-4 bg-white">
          <div className="font-semibold">Đơn hàng</div>

          <div className="space-y-2 max-h-[260px] overflow-auto pr-2">
            {cart.items?.map((it) => {
              const p = it.product || {};
              const img = Array.isArray(p.hinhAnh) ? p.hinhAnh[0] : p.hinhAnh;
              return (
                <div key={it.productId} className="flex items-center gap-3">
                  <img src={img} alt={p.ten} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <div className="text-sm">{p.ten}</div>
                    <div className="text-xs text-slate-500">x{it.qty} · {vnd(p.gia)}</div>
                  </div>
                  <div className="text-sm font-semibold">{vnd((p.gia || 0) * (it.qty || 0))}</div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t flex justify-between">
            <span>Tạm tính</span>
            <span className="font-semibold">{vnd(subtotal)}</span>
          </div>

          {/* Vouchers */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Mã giảm giá (đơn hàng)</label>
              <input
                className={inputCls}
                placeholder="VD: ORDER_10K"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              />
              {orderPreview > 0 && (
                <div className={`${helpCls} text-green-600`}>Ước tính giảm đơn: {vnd(orderPreview)}</div>
              )}
            </div>

            <div>
              <label className={labelCls}>Mã freeship</label>
              <input
                className={inputCls}
                placeholder="VD: FREESHIP_FIRST"
                value={shipCode}
                onChange={(e) => setShipCode(e.target.value.toUpperCase())}
              />
              {shipPreview > 0 && (
                <div className={`${helpCls} text-green-600`}>Ước tính trừ phí ship: {vnd(shipPreview)}</div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className={labelCls}>Phí vận chuyển</label>
              <input
                type="number"
                min="0"
                className={`${inputCls} w-40 text-right`}
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
              />
            </div>
          </div>

          {/* Gợi ý voucher */}
          {suggestions.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <div className="text-sm font-medium">Gợi ý mã áp dụng</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => {
                  const active = (s.target === 'shipping' ? shipCode : discountCode) === s.code;
                  return (
                    <button
                      key={s.code}
                      type="button"
                      className={`${chipBase} ${active ? chipOn : chipOff}`}
                      title={`Ưu đãi ~ ${vnd(s.preview)}`}
                      onClick={() => {
                        if (s.target === 'shipping') {
                          setShipCode(prev => (prev === s.code ? '' : s.code));
                        } else {
                          setDiscountCode(prev => (prev === s.code ? '' : s.code));
                        }
                      }}
                    >
                      {s.label || s.code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tổng cộng theo server */}
          <div className="pt-3 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span>Tổng cộng {quoting && <em className="text-xs text-slate-500">(đang tính…)</em>}</span>
              <span className="font-bold">{vnd(serverTotal)}</span>
            </div>
            <div className="text-xs text-slate-500">
              * Đã tính theo máy chủ (đã trừ mã giảm/ship). Khi đặt hàng sẽ dùng đúng số này.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={!canPlace || placing}
            onClick={handlePlaceOrder}
          >
            {placing ? 'Đang tạo đơn…' : 'Đặt hàng'}
          </button>
          <Link to="/cart" className="block text-center text-sm text-rose-600 hover:underline">
            ← Quay lại giỏ hàng
          </Link>
        </aside>
      </div>
    </div>
  );
}
