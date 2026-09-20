const authService = require('../services/auth.service');
const { AUTH_COOKIE_NAME } = require('../middlewares/authMiddleware');

const cookieOptions = () => {
    const production = process.env.NODE_ENV === 'production';
    const configuredSameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
    const sameSite = ['strict', 'lax', 'none'].includes(configuredSameSite) ? configuredSameSite : 'lax';
    return {
        httpOnly: true,
        secure: production || sameSite === 'none',
        sameSite,
        path: '/',
        maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS) || 8 * 60 * 60 * 1000
    };
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const resultado = await authService.login(email, password);
        res.cookie(AUTH_COOKIE_NAME, resultado.token, cookieOptions());
        const data = {
            usuario: resultado.usuario,
            csrfToken: resultado.csrfToken
        };
        // Los tests y clientes de transición pueden usar Bearer; producción no expone el JWT a JavaScript.
        if (process.env.NODE_ENV === 'test' || process.env.EXPOSE_AUTH_TOKEN === 'true') {
            data.token = resultado.token;
        }
        return res.status(200).json({ message: 'Login exitoso', data });
    } catch (error) {
        // Si es un error controlado (401), devolver ese código
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        // Error no controlado
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const sesion = (req, res) => res.status(200).json({
    data: {
        usuario: { id: req.usuario.id, email: req.usuario.email, rol: req.usuario.rol },
        csrfToken: req.usuario.csrf
    }
});

const logout = (req, res) => {
    const options = cookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: options.httpOnly,
        secure: options.secure,
        sameSite: options.sameSite,
        path: options.path
    });
    return res.status(204).end();
};

module.exports = { login, sesion, logout, cookieOptions };
