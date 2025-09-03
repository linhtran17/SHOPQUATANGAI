import api from './api';

const shipmentService = {
  getByOrder: (orderId) => api.get(`/shipments/order/${orderId}`),
  track: (shipmentId) => api.get(`/shipments/${shipmentId}/track`),
};

export default shipmentService;
