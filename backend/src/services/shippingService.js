async function estimateFee(address, items = []) {
  // ví dụ: nội thành rẻ hơn, cân nặng > 0.5kg thì cộng thêm
  const inCity = ['Hà Nội','Hồ Chí Minh'].includes(address?.province || '');
  const base = inCity ? 20000 : 35000;
  const weight = items.reduce((s,i)=> s + (i.weight || 0.2) * (i.qty || 1), 0); // kg
  const extra = Math.max(0, Math.ceil(weight - 0.5)) * 5000;
  return { fee: base + extra, carrier: 'INHOUSE', method: 'Tiêu chuẩn' };
}
module.exports = { estimateFee };
