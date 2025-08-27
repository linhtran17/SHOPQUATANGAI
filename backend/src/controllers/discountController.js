const { validateAndCalc } = require('../services/discountService');

exports.validate = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const r = await validateAndCalc(code, Number(amount) || 0);
    res.json(r);
  } catch (e) { next(e); }
};
