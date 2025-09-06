import api from "./api";

const categoryService = {
  async list(params = {}) {
    const { data } = await api.get("/categories", { params });
    return data;
  },
  async tree(params = {}) {
    const { data } = await api.get("/categories/tree", { params });
    return data;
  },
  async detail(idOrSlug) {
    const { data } = await api.get(`/categories/${idOrSlug}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/categories", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data;
  },
  async updateActive(id, active) {
    const { data } = await api.patch(`/categories/${id}/active`, { active });
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export default categoryService;
export const categoryApi = categoryService; // giữ alias nếu bạn đã import tên này ở chỗ khác
