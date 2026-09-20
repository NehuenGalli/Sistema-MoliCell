const pool = require('./db');

const migrar = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            CREATE TABLE IF NOT EXISTS gasto (
                id SERIAL PRIMARY KEY,
                categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('Factura', 'Proveedor', 'Alquiler', 'Servicios', 'Impuestos', 'Sueldos', 'General', 'Otro')),
                descripcion VARCHAR(200) NOT NULL,
                monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
                fecha DATE NOT NULL DEFAULT CURRENT_DATE,
                proveedor VARCHAR(120),
                comprobante VARCHAR(80),
                notas TEXT,
                creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_gasto_fecha ON gasto (fecha DESC, id DESC);
            CREATE INDEX IF NOT EXISTS idx_gasto_categoria_fecha ON gasto (categoria, fecha DESC);
        `);
        await client.query('COMMIT');
        console.log('Migración de gestión aplicada correctamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('No se pudo aplicar la migración de gestión:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

migrar();
