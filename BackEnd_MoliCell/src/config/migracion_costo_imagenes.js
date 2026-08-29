const pool = require('./db');

const migrarCostoEImagenes = async () => {
    try {
        console.log('⏳ Aplicando migración: precio_costo e imagenes en producto...');
        await pool.query(`
            ALTER TABLE producto 
            ADD COLUMN IF NOT EXISTS precio_costo NUMERIC(12, 2) DEFAULT 0;
            
            ALTER TABLE producto 
            ADD COLUMN IF NOT EXISTS imagenes TEXT[] DEFAULT '{}';

            ALTER TABLE producto 
            ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '{}'::jsonb;
        `);
        console.log('✅ Migración ejecutada con éxito.');
    } catch (error) {
        console.error('❌ Error al ejecutar la migración:', error);
    } finally {
        await pool.end();
    }
};

migrarCostoEImagenes();
