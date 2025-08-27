const router = require('express').Router();
const ctrl = require('../controllers/productController');

router.get('/',      ctrl.list);
router.get('/:id',   ctrl.detail);
router.post('/',     ctrl.create);
router.put('/:id',   ctrl.update);
router.delete('/:id',ctrl.remove);

module.exports = router;
