const pool = require('./db');
const crypto = require('crypto');

const migrarCodigoSeguimiento = async () => {
    try {
        console.log('🔄 Verificando tabla servicio_tecnico...');

        // 1. Agregar la columna si no existe (permitiendo NULL temporalmente)
        await pool.query(`
            ALTER TABLE servicio_tecnico 
            ADD COLUMN IF NOT EXISTS codigo_seguimiento VARCHAR(20) UNIQUE;
        `);

        // 2. Buscar filas que no tengan código de seguimiento
        const { rows } = await pool.query(`
            SELECT id FROM servicio_tecnico WHERE codigo_seguimiento IS NULL;
        `);

        if (rows.length > 0) {
            console.log(`📦 Asignando códigos a ${rows.length} registros existentes...`);
            for (const row of rows) {
                const codigo = `MC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
                await pool.query(`
                    UPDATE servicio_tecnico SET codigo_seguimiento = $1 WHERE id = $2;
                `, [codigo, row.id]);
            }
        }

        console.log('✅ Migración de servicio_tecnico completada con éxito.');
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

migrarCodigoSeguimiento();
