// src/services/productService.js
import api from './api';

const productService = {
  async list(params = {}) {
    const { data } = await api.get('/products', { params });
    return data; // { items, total, page, limit }
  },
  async detail(id) {
    const { data } = await api.get(`/products/${id}`);
    return data; // 1 product
  },
};

export default productService;
