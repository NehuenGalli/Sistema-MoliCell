const pool = require('./db');

const migrarCodigoVenta = async () => {
    try {
        console.log('⏳ Aplicando migración: codigo_venta en tabla venta...');
        await pool.query(`
            ALTER TABLE venta 
            ADD COLUMN IF NOT EXISTS codigo_venta VARCHAR(30) UNIQUE;
        `);
        console.log('✅ Migración de codigo_venta ejecutada con éxito.');
    } catch (error) {
        console.error('❌ Error al ejecutar la migración:', error);
    } finally {
        await pool.end();
    }
};

migrarCodigoVenta();
