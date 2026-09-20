const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const pool = require('../config/db');

const JWT_ISSUER = 'molicell-api';
const JWT_AUDIENCE = 'molicell-admin';
// Hash bcrypt válido usado para igualar el costo de CPU cuando el email no existe.
const DUMMY_PASSWORD_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5S5M5fR9XQj7gBZFS0bZ4p8L7lYQyGu';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no está configurado');
    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }
    return secret;
};

const login = async (email, password) => {
    // 1. Buscar usuario por email
    const result = await pool.query('SELECT * FROM usuario WHERE LOWER(email) = LOWER($1)', [email]);
    const usuario = result.rows[0];

    // Ejecutar bcrypt aun cuando el usuario no exista evita enumeración por tiempos.
    const passwordValido = await bcrypt.compare(password, usuario?.password || DUMMY_PASSWORD_HASH);

    if (!usuario || !passwordValido) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    // 4. Generar token JWT — incluye rol para que el middleware pueda verificar autorización
    const rolUsuario = usuario.rol || 'admin';
    const csrfToken = crypto.randomBytes(32).toString('base64url');
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: rolUsuario, csrf: csrfToken },
        getJwtSecret(),
        {
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN || '8h',
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            jwtid: crypto.randomUUID()
        }
    );

    return { 
        token,
        csrfToken,
        usuario: { id: usuario.id, email: usuario.email, rol: rolUsuario }
    };
};

module.exports = { login, getJwtSecret, JWT_ISSUER, JWT_AUDIENCE };
