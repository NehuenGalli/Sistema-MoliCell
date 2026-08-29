const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (email, password) => {
    // 1. Buscar usuario por email
    const result = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);
    const usuario = result.rows[0];

    // 2. Si no existe, lanzar error genérico (no revelar si el email existe o no)
    if (!usuario) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    // 3. Comparar contraseña con el hash almacenado
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    // 4. Generar token JWT — incluye rol para que el middleware pueda verificar autorización
    const rolUsuario = usuario.rol || 'admin'; // Todos los usuarios actuales son admin
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: rolUsuario },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return { 
        token,
        usuario: { id: usuario.id, email: usuario.email, rol: rolUsuario }
    };
};

module.exports = { login };
