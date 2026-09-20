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

            CREATE TABLE IF NOT EXISTS deuda (
                id SERIAL PRIMARY KEY,
                persona_nombre VARCHAR(120) NOT NULL,
                telefono VARCHAR(50),
                concepto VARCHAR(240) NOT NULL,
                origen VARCHAR(20) NOT NULL CHECK (origen IN ('Venta', 'Servicio', 'Otro')),
                referencia VARCHAR(80),
                monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
                fecha DATE NOT NULL DEFAULT CURRENT_DATE,
                vencimiento DATE,
                estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Parcial', 'Pagada')),
                notas TEXT,
                creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS deuda_pago (
                id SERIAL PRIMARY KEY,
                deuda_id INT NOT NULL REFERENCES deuda(id) ON DELETE CASCADE,
                monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
                fecha DATE NOT NULL DEFAULT CURRENT_DATE,
                notas VARCHAR(500),
                creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_deuda_estado_fecha ON deuda (estado, fecha DESC);
            CREATE INDEX IF NOT EXISTS idx_deuda_pago_deuda_fecha ON deuda_pago (deuda_id, fecha DESC, id DESC);
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
