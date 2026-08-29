const bcrypt = require('bcrypt');
const pool = require('./db');
require('dotenv').config();

const seedAdmin = async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@molicell.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    try {
        const hash = await bcrypt.hash(password, 12);

        // Verificar si el admin ya existe
        const existe = await pool.query('SELECT id FROM usuario WHERE email = $1', [email]);

        if (existe.rows.length > 0) {
            await pool.query('UPDATE usuario SET password = $1 WHERE email = $2', [hash, email]);
            console.log(`✅ Contraseña de admin actualizada para: ${email}`);
        } else {
            await pool.query('INSERT INTO usuario (email, password) VALUES ($1, $2)', [email, hash]);
            console.log(`✅ Admin creado exitosamente con email: ${email}`);
        }
    } catch (error) {
        console.error('❌ Error al crear/actualizar el admin:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

seedAdmin();
