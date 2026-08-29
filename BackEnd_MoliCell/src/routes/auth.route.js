const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const validarSchema = require('../middlewares/validarSchema');
const { loginSchema } = require('../validators/authValidator');
const authController = require('../controllers/auth.controller');

// Rate limiter: máximo 5 intentos de login cada 15 minutos por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, validarSchema(loginSchema), authController.login);

module.exports = router;
