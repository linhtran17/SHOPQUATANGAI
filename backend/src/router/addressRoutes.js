// backend/src/router/addressRoutes.js
const router = require('express').Router();
const c = require('../controllers/addressController');
// Đúng
const { requireAuth } = require('../middleware/auth');

router.get('/',    requireAuth, c.list);
router.post('/',   requireAuth, c.create);
router.put('/:id', requireAuth, c.update);
router.delete('/:id', requireAuth, c.remove);

module.exports = router;
