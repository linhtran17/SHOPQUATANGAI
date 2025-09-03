// src/utils/format.js
export const vnd = (n) =>
  (Number(n) || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

// (tuỳ chọn) thêm vài helper nếu cần:
export const num = (n) => (Number(n) || 0).toLocaleString('vi-VN');
