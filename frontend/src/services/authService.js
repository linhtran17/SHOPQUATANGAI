import api from './api';

const authApi = {
  async register({ email, password, name }) {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data;
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.user;
  }
};

export default authApi;  