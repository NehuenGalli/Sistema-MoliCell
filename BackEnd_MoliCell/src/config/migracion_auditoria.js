const pool = require('./db');

const migrar = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            ALTER TABLE usuario ADD COLUMN IF NOT EXISTS rol VARCHAR(20);
            UPDATE usuario SET rol = 'admin' WHERE rol IS NULL;
            ALTER TABLE usuario ALTER COLUMN rol SET DEFAULT 'admin';
            ALTER TABLE usuario ALTER COLUMN rol SET NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_producto_activo_stock ON producto (activo, stock);
            CREATE INDEX IF NOT EXISTS idx_producto_marca ON producto (marca_id);
            CREATE INDEX IF NOT EXISTS idx_producto_categoria_categoria ON producto_categoria (categoria_id, producto_id);
            CREATE INDEX IF NOT EXISTS idx_servicio_tecnico_estado_creado ON servicio_tecnico (estado, creado_en DESC);
            CREATE INDEX IF NOT EXISTS idx_servicio_tecnico_codigo_upper ON servicio_tecnico (UPPER(codigo_seguimiento));
            CREATE INDEX IF NOT EXISTS idx_venta_creado ON venta (creado_en DESC);
            CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle (venta_id);
        `);
        await client.query('COMMIT');
        console.log('Migración de auditoría aplicada correctamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('No se pudo aplicar la migración de auditoría:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

migrar();
