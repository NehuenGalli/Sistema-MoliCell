const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const validarSchema = require('../middlewares/validarSchema');
const { loginSchema } = require('../validators/authValidator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Rate limiter: máximo 5 intentos de login cada 15 minutos por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

router.post('/login', loginLimiter, validarSchema(loginSchema), authController.login);
router.get('/session', authMiddleware, authController.sesion);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
