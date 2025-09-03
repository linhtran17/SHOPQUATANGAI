import api from './api';

const orderService = {
  create: (data) => api.post('/orders', data),
  myOrders: () => api.get('/orders'),
  detail:  (id)    => api.get(`/orders/${id}`),  
};

export default orderService;
