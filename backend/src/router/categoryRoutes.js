const router = require('express').Router();
const ctrl = require('../controllers/categoryController');

router.get('/',        ctrl.list);
router.get('/tree',    ctrl.tree);
router.get('/:idOrSlug', ctrl.detail);
router.post('/',       ctrl.create);
router.put('/:id',     ctrl.update);
router.delete('/:id',  ctrl.remove);

module.exports = router;
