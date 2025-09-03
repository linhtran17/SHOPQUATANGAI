import api from './api';

const productApi = {
  async list(params = {}) {
    const { data } = await api.get('/products', { params });
    return data;
  },
  async detail(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  }
};

export default productApi;  // Default export
