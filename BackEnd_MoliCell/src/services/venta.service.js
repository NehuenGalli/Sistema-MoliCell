const pool = require('../config/db');
const crypto = require('crypto');
const { ventaToResponseDTO } = require('../dtos/venta.dto');

const businessError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const crearVenta = async (ventaData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { codigo_venta, metodo_pago, productos } = ventaData;
        // #13 Fix: usar crypto.randomBytes para evitar colisiones (Math.random solo tiene 9000 valores)
        const codigoFinal = codigo_venta || `VEN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Agrupar defensivamente evita descuentos inconsistentes si otro cliente
        // omite la validación de unicidad del request.
        const cantidadesPorProducto = new Map();
        for (const item of productos) {
            cantidadesPorProducto.set(
                item.producto_id,
                (cantidadesPorProducto.get(item.producto_id) || 0) + item.cantidad
            );
        }
        const idsProductos = [...cantidadesPorProducto.keys()].sort((a, b) => a - b);
        const cantidades = idsProductos.map((id) => cantidadesPorProducto.get(id));

        // Bloquear filas antes de validar stock evita sobreventa entre requests concurrentes.
        const productosResult = await client.query(
            `SELECT id, precio, descuento, descuento_precio, stock, activo
             FROM producto
             WHERE id = ANY($1::int[])
             ORDER BY id
             FOR UPDATE`,
            [idsProductos]
        );

        if (productosResult.rows.length !== idsProductos.length) {
            throw businessError('No se puede crear la venta porque uno o más productos no existen.', 404);
        }

        let montoCalculado = 0;
        for (const producto of productosResult.rows) {
            const cantidad = cantidadesPorProducto.get(producto.id);
            if (!producto.activo) throw businessError('Uno o más productos no están activos.', 409);
            if (Number(producto.stock) < cantidad) {
                throw businessError('No hay stock suficiente para uno o más productos de la lista.', 400);
            }
            const precioVigente = producto.descuento && producto.descuento_precio
                ? Number(producto.descuento_precio)
                : Number(producto.precio);
            montoCalculado += precioVigente * cantidad;
        }
        montoCalculado = Math.round((montoCalculado + Number.EPSILON) * 100) / 100;

        // 2. Insertamos la venta principal con su código único
        const queryVenta = 'INSERT INTO venta (codigo_venta, monto, metodo_pago) VALUES ($1, $2, $3) RETURNING *';
        const valuesVenta = [codigoFinal, montoCalculado, metodo_pago];
        const resultVenta = await client.query(queryVenta, valuesVenta);
        const ventaId = resultVenta.rows[0].id;

        // 3. DESCONTAR STOCK MASIVO
        const queryUpdateStock = `
            UPDATE producto AS p
            SET stock = p.stock - v.cantidad
            FROM unnest($1::int[], $2::int[]) AS v(producto_id, cantidad)
            WHERE p.id = v.producto_id;
        `;
        const stockResult = await client.query(queryUpdateStock, [idsProductos, cantidades]);
        if (stockResult.rowCount !== idsProductos.length) {
            throw businessError('No se pudo actualizar el stock de todos los productos.', 409);
        }

        // 4. GUARDAR EN VENTA_DETALLE MASIVO
        const queryInsertDetalles = `
            INSERT INTO venta_detalle (venta_id, producto_id, cantidad)
            SELECT $1, unnest($2::int[]), unnest($3::int[]);
        `;
        await client.query(queryInsertDetalles, [ventaId, idsProductos, cantidades]);

        await client.query('COMMIT');

        return await obtenerVentaPorId(ventaId);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const obtenerVentas = async (params = {}) => {
    const { filtro, fecha, metodo_pago, min_monto, max_monto, search, page = 1, limit = 15 } = params;
    const conditions = [];
    const values = [];

    if (fecha) {
        values.push(fecha);
        conditions.push(`v.fecha = $${values.length}`);
    } else if (filtro === 'semana') {
        conditions.push("v.fecha >= CURRENT_DATE - INTERVAL '7 days'");
    } else if (filtro === 'mes') {
        conditions.push("v.fecha >= CURRENT_DATE - INTERVAL '30 days'");
    }

    if (metodo_pago && metodo_pago !== 'todos') {
        values.push(metodo_pago);
        conditions.push(`LOWER(v.metodo_pago) = LOWER($${values.length})`);
    }

    if (min_monto !== undefined && min_monto !== '' && !isNaN(parseFloat(min_monto))) {
        values.push(parseFloat(min_monto));
        conditions.push(`v.monto >= $${values.length}`);
    }

    if (max_monto !== undefined && max_monto !== '' && !isNaN(parseFloat(max_monto))) {
        values.push(parseFloat(max_monto));
        conditions.push(`v.monto <= $${values.length}`);
    }

    if (search && search.trim()) {
        values.push(`%${search.trim().toLowerCase()}%`);
        conditions.push(`(LOWER(v.codigo_venta) LIKE $${values.length} OR LOWER(v.metodo_pago) LIKE $${values.length} OR v.id::text LIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Conteo total de items coincidentes para controles de paginación
    const countQuery = `SELECT COUNT(DISTINCT v.id) AS total FROM venta v ${whereClause};`;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0]?.total || 0, 10);

    // 2. Parámetros de paginación en PostgreSQL (Default 15 ventas por página)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const queryValues = [...values];
    queryValues.push(limitNum);
    const limitIndex = queryValues.length;
    queryValues.push(offset);
    const offsetIndex = queryValues.length;

    const query = `
        SELECT v.id, v.codigo_venta, v.monto, v.metodo_pago, v.fecha, v.creado_en,
               COALESCE(
                   json_agg(
                       json_build_object(
                           'producto_id', p.id,
                           'name', p.name,
                           'precio', p.precio,
                           'precio_costo', p.precio_costo,
                           'cantidad', vd.cantidad
                       )
                   ) FILTER (WHERE p.id IS NOT NULL), '[]'
               ) AS productos
        FROM venta v
        LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
        LEFT JOIN producto p ON vd.producto_id = p.id
        ${whereClause}
        GROUP BY v.id
        ORDER BY v.creado_en DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex};
    `;

    const result = await pool.query(query, queryValues);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return {
        ventas: result.rows.map(ventaToResponseDTO),
        pagination: {
            totalItems,
            totalPages,
            currentPage: pageNum,
            limit: limitNum
        }
    };
};

const obtenerVentaPorId = async (id) => {
    const queryVenta = `
        SELECT id, codigo_venta, monto, metodo_pago, fecha, creado_en 
        FROM venta 
        WHERE id = $1;
    `;

    const queryProductos = `
        SELECT p.id AS producto_id, p.name, p.precio, p.precio_costo, vd.cantidad
        FROM venta_detalle vd
        JOIN producto p ON vd.producto_id = p.id
        WHERE vd.venta_id = $1;
    `;

    // Ejecución en paralelo
    const [resVenta, resProductos] = await Promise.all([
        pool.query(queryVenta, [id]),
        pool.query(queryProductos, [id])
    ]);

    if (resVenta.rows.length === 0) return null;
    return ventaToResponseDTO({ ...resVenta.rows[0], productos: resProductos.rows });
};

// #6 Fix: eliminarVenta ahora usa transacción completa para garantizar
// consistencia del stock si el DELETE falla después del UPDATE de stock
const eliminarVenta = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener productos de la venta ANTES de borrarla (dentro de la transacción)
        const detalleResult = await client.query(
            'SELECT producto_id, cantidad FROM venta_detalle WHERE venta_id = $1', [id]
        );

        const idsProductos = detalleResult.rows.map(p => p.producto_id);
        const cantidades = detalleResult.rows.map(p => p.cantidad);

        // 2. Sumar stock nuevamente
        if (idsProductos.length > 0) {
            const queryUpdateStock = `
                UPDATE producto AS p
                SET stock = p.stock + v.cantidad
                FROM unnest($1::int[], $2::int[]) AS v(producto_id, cantidad)
                WHERE p.id = v.producto_id;
            `;
            await client.query(queryUpdateStock, [idsProductos, cantidades]);
        }

        // 3. Borrar la venta (ON DELETE CASCADE elimina venta_detalle automáticamente)
        const query = 'DELETE FROM venta WHERE id = $1 RETURNING *;';
        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        await client.query('COMMIT');
        return ventaToResponseDTO(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { crearVenta, obtenerVentas, obtenerVentaPorId, eliminarVenta };
