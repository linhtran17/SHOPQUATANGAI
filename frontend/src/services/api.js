// src/services/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL,
  withCredentials: false, // nếu backend dùng cookie session thì sẽ đổi thành true (xem mục 4)
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('token');
  if (stored && stored !== 'null' && stored !== 'undefined') {
    // Nếu token đã có "Bearer " thì dùng luôn, không thì tự thêm
    config.headers.Authorization = stored.startsWith('Bearer ')
      ? stored
      : `Bearer ${stored}`;
  }
  return config;
});

export default api;
