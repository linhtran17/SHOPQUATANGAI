// src/services/checkoutService.js
import api from './api';

const checkoutService = {
  preview: (payload) => api.post('/checkout/preview', payload),
  confirm: (payload) => api.post('/checkout/confirm', payload),
};

export default checkoutService;
