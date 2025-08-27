const router = require('express').Router();
const c = require('../controllers/authController');
const { authOptional, requireAuth } = require('../middleware/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', authOptional, requireAuth, c.me);

module.exports = router;
