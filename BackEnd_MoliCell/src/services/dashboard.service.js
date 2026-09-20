const pool = require('../config/db');

const obtenerResumen = async () => {
    const query = `
        SELECT
            (SELECT COUNT(*)::int FROM producto WHERE activo = true) AS productos_activos,
            (SELECT COUNT(*)::int FROM producto WHERE activo = true AND stock < 10) AS productos_stock_bajo,
            COALESCE((
                SELECT json_agg(p ORDER BY p.stock ASC, p.id DESC)
                FROM (
                    SELECT id, name, stock, img_url,
                           COALESCE((
                               SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
                               FROM producto_categoria pc
                               JOIN categoria c ON c.id = pc.categoria_id
                               WHERE pc.producto_id = producto.id
                           ), '[]') AS categorias
                    FROM producto
                    WHERE activo = true AND stock < 10
                    ORDER BY stock ASC, id DESC
                    LIMIT 5
                ) p
            ), '[]') AS alertas_stock,
            (SELECT COUNT(*)::int FROM servicio_tecnico WHERE estado <> 'Entregado') AS reparaciones_activas,
            COALESCE((
                SELECT json_agg(r ORDER BY r.creado_en DESC)
                FROM (
                    SELECT id, codigo_seguimiento, cliente_nombre, dispositivo, estado, creado_en
                    FROM servicio_tecnico
                    ORDER BY creado_en DESC
                    LIMIT 5
                ) r
            ), '[]') AS reparaciones_recientes,
            (SELECT COUNT(*)::int FROM venta) AS ventas_totales;
    `;

    const result = await pool.query(query);
    return result.rows[0];
};

module.exports = { obtenerResumen };
