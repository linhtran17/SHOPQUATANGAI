import api from "./api";

const orderService = {
  // USER
  async create(payload) {
    const { data } = await api.post("/orders", payload);
    return data;
  },
  async myOrders(params = {}) {
    const { data } = await api.get("/orders", { params });
    return data; // [] đơn của tôi
  },
  async detail(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data; // chi tiết đơn của tôi
  },

  // ADMIN
  async adminList(params = {}) {
    const { data } = await api.get("/orders/admin", { params });
    return data; // { items, total, page, limit }
  },
  async adminDetail(id) {
    const { data } = await api.get(`/orders/admin/${id}`);
    return data; // { ...order, payments, shipment, payable }
  },

  // ADMIN actions
  async confirm(id) {
    const { data } = await api.post(`/orders/${id}/confirm`);
    return data;
  },
  async fulfill(id) {
    const { data } = await api.post(`/orders/${id}/fulfill`);
    return data;
  },
  async cancel(id) {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data;
  },
  async delivered(id) {
    const { data } = await api.post(`/orders/${id}/delivered`);
    return data;
  },
};

export default orderService;
