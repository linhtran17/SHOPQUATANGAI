// backend/src/utils/res.api.js
function resSuccess(res, data, status = 200) {
  return res.status(status).json(data);
}
function resError(res, message = 'Đã xảy ra lỗi', status = 400, extra) {
  const body = { message };
  if (extra && typeof extra === 'object') Object.assign(body, extra);
  return res.status(status).json(body);
}
module.exports = { resSuccess, resError };
