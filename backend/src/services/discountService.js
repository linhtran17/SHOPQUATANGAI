// src/services/discountService.js
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');

function inTime(d, now=new Date()){ return (!d.startAt || now>=d.startAt) && (!d.endAt || now<=d.endAt); }
function calc(d, amount){
  let v = d.type==='percent' ? Math.floor(amount*d.value/100) : d.value;
  if (d.maxDiscount!=null) v = Math.min(v, d.maxDiscount);
  return Math.max(0, Math.min(v, amount));
}
async function canUseByUser(d, userId){
  if (!d.perUserLimit || !userId) return true;
  const used = await DiscountUsage.countDocuments({ code:d.code, userId });
  return used < d.perUserLimit;
}

// validate 1 mã cho đúng target
async function validateForTarget(code, amount, userId, target){
  if (!code) return { valid:false, discount:0, reason:'Thiếu mã' };
  const d = await Discount.findOne({ code:String(code).toUpperCase(), active:true, target }).lean();
  if (!d) return { valid:false, discount:0, reason:'Mã không tồn tại/đã tắt' };
  if (!inTime(d)) return { valid:false, discount:0, reason:'Chưa tới hạn/đã hết hạn' };
  if (d.usageLimit && d.usedCount>=d.usageLimit) return { valid:false, discount:0, reason:'Hết lượt' };
  if (amount < (d.minOrder||0)) return { valid:false, discount:0, reason:'Chưa đạt tối thiểu' };
  if (!(await canUseByUser(d, userId))) return { valid:false, discount:0, reason:'Hết lượt cho tài khoản' };
  return { valid:true, discount:calc(d, amount), meta:d };
}

// chọn mã tốt nhất (1 mã/đơn, 1 mã freeship)
async function pickBestOrderVoucher(userId, amount){
  const rows = await Discount.find({ active:true, target:'order', isPublic:true }).lean();
  let best=null, val=0;
  for (const d of rows){
    if (!inTime(d)) continue;
    if (d.usageLimit && d.usedCount>=d.usageLimit) continue;
    if (amount < (d.minOrder||0)) continue;
    if (!(await canUseByUser(d, userId))) continue;
    const v = calc(d, amount);
    if (v>val){ val=v; best=d; }
  }
  return best ? { code:best.code, discount:val } : { code:null, discount:0 };
}
async function pickBestFreeship(userId, shipFee){
  const rows = await Discount.find({ active:true, target:'shipping', isPublic:true }).lean();
  let best=null, val=0;
  for (const d of rows){
    if (!inTime(d)) continue;
    if (d.usageLimit && d.usedCount>=d.usageLimit) continue;
    if (!(await canUseByUser(d, userId))) continue;
    const v = calc(d, shipFee);
    if (v>val){ val=v; best=d; }
  }
  return best ? { code:best.code, discount:val } : { code:null, discount:0 };
}

module.exports = { validateForTarget, pickBestOrderVoucher, pickBestFreeship };
