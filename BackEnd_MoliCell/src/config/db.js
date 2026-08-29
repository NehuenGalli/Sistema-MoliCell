const { Pool } = require('pg');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const pool = new Pool({
    connectionString: isTest ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Reutilización eficiente de hasta 20 conexiones en memoria
    idleTimeoutMillis: 30000, // Mantener conexiones abiertas 30 segundos para evitar reconexiones
    connectionTimeoutMillis: 2000
});

if (!isTest) {
    pool.on('connect', () => {
        console.log('📦 Conectado a la Base de Datos PostgreSQL');
    });
    // Nota: las migraciones de esquema deben ejecutarse con: pnpm run init-db
    // No se hacen ALTER TABLE en el startup para evitar locks en producción
}

module.exports = pool;