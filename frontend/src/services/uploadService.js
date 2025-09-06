import api from "./api";

const uploadService = {
  async upload(files) {
    const fd = new FormData();
    [...files].forEach(f => fd.append("files", f));
    const { data } = await api.post("/uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const urls = data?.urls || [];
    return urls.filter(Boolean);
  },
};
export default uploadService;
