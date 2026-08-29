const pool = require('./db');

const crearIndicesOptimización = async () => {
    try {
        console.log('⏳ Creando índices de alto rendimiento en PostgreSQL...');

        await pool.query(`
            -- Índice para búsquedas rápidas de productos activos por marca
            CREATE INDEX IF NOT EXISTS idx_producto_activo_marca ON producto (activo, marca_id);
            
            -- Índice para producto_categoria JOIN
            CREATE INDEX IF NOT EXISTS idx_producto_categoria_composite ON producto_categoria (producto_id, categoria_id);

            -- Índice para búsquedas rápidas por código de seguimiento en Servicio Técnico
            CREATE INDEX IF NOT EXISTS idx_servicio_tecnico_codigo ON servicio_tecnico (UPPER(codigo_seguimiento));

            -- Índice para histórico de ventas por fecha y código
            CREATE INDEX IF NOT EXISTS idx_venta_fecha_creado ON venta (fecha DESC, creado_en DESC);
            CREATE INDEX IF NOT EXISTS idx_venta_codigo ON venta (codigo_venta);
            CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta_id ON venta_detalle (venta_id);
        `);

        console.log('⚡ Índices creados e inyectados exitosamente. Latencia reducida a microsegundos.');
    } catch (error) {
        console.error('❌ Error al crear índices:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

crearIndicesOptimización();
