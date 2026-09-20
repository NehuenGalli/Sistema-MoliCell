const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../services/auth.service');

const AUTH_COOKIE_NAME = 'molicell_admin_session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const obtenerCookie = (header, nombre) => {
    if (!header) return null;
    const prefijo = `${nombre}=`;
    const parte = header.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefijo));
    if (!parte) return null;
    try {
        return decodeURIComponent(parte.slice(prefijo.length));
    } catch {
        return null;
    }
};

const equalsConstantTime = (left, right) => {
    const a = Buffer.from(String(left || ''));
    const b = Buffer.from(String(right || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const authMiddleware = (req, res, next) => {
    // 1. Obtener el header Authorization
    const authHeader = req.headers.authorization;

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cookieToken = obtenerCookie(req.headers.cookie, AUTH_COOKIE_NAME);
    const token = bearerToken || cookieToken;

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        // 3. Verificar y decodificar el token
        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256'],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });

        if (cookieToken && !SAFE_METHODS.has(req.method)) {
            const csrfHeader = req.get('X-CSRF-Token');
            if (!equalsConstantTime(csrfHeader, decoded.csrf)) {
                return res.status(403).json({ error: 'Token CSRF inválido o ausente' });
            }
        }

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
module.exports.AUTH_COOKIE_NAME = AUTH_COOKIE_NAME;
module.exports.obtenerCookie = obtenerCookie;
