// src/services/inventoryService.js
import api from './api';

const inventoryService = {
  async list(params = {}) {
    const { data } = await api.get('/inventory', { params });
    return data;
  },
  async summary(params = {}) {
    const { data } = await api.get('/inventory/summary', { params });
    return data;
  },
  async history(productId) {
    const { data } = await api.get(`/inventory/${productId}/history`);
    return data;
  },
  async updateThreshold(productId, lowStockThreshold) {
    const { data } = await api.patch(`/inventory/${productId}/threshold`, { lowStockThreshold });
    return data;
  },
  async receive(productId, qty, note='') {
    const { data } = await api.post(`/inventory/${productId}/receive`, { qty, note });
    return data;
  },
  async issue(productId, qty, note='') {
    const { data } = await api.post(`/inventory/${productId}/issue`, { qty, note });
    return data;
  },
  async adjust(productId, mode, qty, note='') {
    const { data } = await api.post(`/inventory/${productId}/adjust`, { mode, qty, note });
    return data;
  },
  async stocktake(productId, countedQty, note='') {
    const { data } = await api.post(`/inventory/${productId}/stocktake`, { qty: countedQty, note });
    return data;
  },
};

export default inventoryService;
