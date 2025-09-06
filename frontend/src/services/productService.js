import api from "./api";

const productService = {
  async list(params = {}) {
    const { data } = await api.get("/products", { params });
    return data;
  },
  async detail(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/products", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },
  async updateActive(id, active) {
    // dùng PATCH chuyên cho bật/tắt
    const { data } = await api.patch(`/products/${id}/active`, { active });
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

export default productService;
