import api from './api';

const discountService = {
  validate: (code, amount, kind='order') =>
    api.post('/discounts/validate', { code, amount, kind }),

  available: (orderAmount, shippingAmount=0) =>
    api.get('/discounts/available', { params: { orderAmount, shippingAmount } }),

  quote: (payload) => // { subtotal, shippingFee, discountCode, freeShipCode }
    api.post('/discounts/quote', payload),
};

export default discountService;
