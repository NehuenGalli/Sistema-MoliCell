const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Obtener el header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // 2. Extraer el token (quitar "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Adjuntar los datos del usuario al request para uso posterior
        req.usuario = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware adicional: verifica que el usuario tenga rol de admin
// Se usa en cadena: authMiddleware, requireAdmin
const requireAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
