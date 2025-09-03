import api from './api';

const paymentService = {
  capture: (paymentId) => api.post(`/payments/${paymentId}/capture`),
};

export default paymentService;
