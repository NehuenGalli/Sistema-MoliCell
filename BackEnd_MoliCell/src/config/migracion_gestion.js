const pool = require('./db');

const migrar = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            ALTER TABLE venta ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2);
            ALTER TABLE venta ADD COLUMN IF NOT EXISTS descuento_porcentaje NUMERIC(5, 2) DEFAULT 0;
            ALTER TABLE venta ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(12, 2) DEFAULT 0;
            UPDATE venta SET subtotal = monto WHERE subtotal IS NULL;
            UPDATE venta SET descuento_porcentaje = 0 WHERE descuento_porcentaje IS NULL;
            UPDATE venta SET descuento_monto = 0 WHERE descuento_monto IS NULL;
            ALTER TABLE venta ALTER COLUMN subtotal SET NOT NULL;
            ALTER TABLE venta ALTER COLUMN descuento_porcentaje SET NOT NULL;
            ALTER TABLE venta ALTER COLUMN descuento_monto SET NOT NULL;

            ALTER TABLE venta_detalle ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(12, 2);
            ALTER TABLE venta_detalle ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(12, 2);
            UPDATE venta_detalle vd
            SET precio_unitario = COALESCE(vd.precio_unitario, CASE WHEN p.descuento AND p.descuento_precio IS NOT NULL THEN p.descuento_precio ELSE p.precio END),
                costo_unitario = COALESCE(vd.costo_unitario, p.precio_costo, 0)
            FROM producto p WHERE p.id = vd.producto_id AND (vd.precio_unitario IS NULL OR vd.costo_unitario IS NULL);
            ALTER TABLE venta_detalle ALTER COLUMN precio_unitario SET NOT NULL;
            ALTER TABLE venta_detalle ALTER COLUMN costo_unitario SET DEFAULT 0;
            ALTER TABLE venta_detalle ALTER COLUMN costo_unitario SET NOT NULL;

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
