import api from './api';

const cartService = {
  getCart:            ()                 => api.get('/cart'),
  addItem:            (productId, qty=1) => api.post('/cart/items', { productId, qty }),
  updateItem:         (productId, qty)   => api.put(`/cart/items/${productId}`, { qty }),
  removeItem:         (productId)        => api.delete(`/cart/items/${productId}`),
  clear:              ()                 => api.delete('/cart'),
};

export default cartService;
