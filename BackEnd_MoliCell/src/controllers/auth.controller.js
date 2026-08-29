const authService = require('../services/auth.service');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const resultado = await authService.login(email, password);
        return res.status(200).json({ message: 'Login exitoso', data: resultado });
    } catch (error) {
        // Si es un error controlado (401), devolver ese código
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        // Error no controlado
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login };
