const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

// Crea las tablas y seedea el admin de pruebas antes de TODOS los tests
beforeAll(async () => {
    // 1. Eliminar tablas en orden inverso de dependencias (para evitar errores de FK)
    await pool.query(`
        DROP TABLE IF EXISTS venta_detalle CASCADE;
        DROP TABLE IF EXISTS venta CASCADE;
        DROP TABLE IF EXISTS producto_categoria CASCADE;
        DROP TABLE IF EXISTS producto CASCADE;
        DROP TABLE IF EXISTS servicio_tecnico CASCADE;
        DROP TABLE IF EXISTS categoria CASCADE;
        DROP TABLE IF EXISTS marca CASCADE;
        DROP TABLE IF EXISTS usuario CASCADE;
    `);

    // 2. Crear tablas desde init.sql
    const sqlPath = path.join(__dirname, '..', 'src', 'config', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);

    // 3. Seedear un admin de pruebas
    const hash = await bcrypt.hash('TestPassword123!', 12);
    await pool.query(
        'INSERT INTO usuario (email, password) VALUES ($1, $2)',
        ['test@molicell.com', hash]
    );
});

// Cerrar el pool de conexiones al finalizar TODOS los tests
afterAll(async () => {
    await pool.end();
});
