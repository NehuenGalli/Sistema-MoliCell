const fs = require('fs');
const path = require('path');
const pool = require('./db');

const initDb = async () => {
    try {
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⏳ Creando tablas en la base de datos...');
        await pool.query(sql);
        console.log('✅ Tablas creadas con éxito.');
    } catch (error) {
        console.error('❌ Error al ejecutar init.sql:', error);
    } finally {
        await pool.end();
    }
};

initDb();
