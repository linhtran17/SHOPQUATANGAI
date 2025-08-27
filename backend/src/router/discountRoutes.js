const router = require('express').Router();
const c = require('../controllers/discountController');
router.post('/validate', c.validate);
module.exports = router;
