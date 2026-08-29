const pool = require('../config/db');
const { toProductoAdminDTO, toProductoPublicoDTO } = require('../dtos/producto.dto');


// CREAR PRODUCTO
const crearProducto = async (datosProducto) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');



        const {
            name, descripcion, precio, precio_costo = 0, descuento, descuento_precio, destacado = false, stock, activo, img_url, imagenes = [], marca_id, especificaciones = {}, categorias = [] } = datosProducto;

        const imagenesFinales = Array.isArray(imagenes) && imagenes.length > 0 ? imagenes : (img_url ? [img_url] : []);
        const imgUrlFinal = img_url || (imagenesFinales.length > 0 ? imagenesFinales[0] : null);

        const query = `
            INSERT INTO producto (name, descripcion, precio, precio_costo, descuento, descuento_precio, destacado, stock, activo, img_url, imagenes, marca_id, especificaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const values = [name, descripcion, precio, precio_costo, descuento, descuento_precio, destacado, stock, activo, imgUrlFinal, imagenesFinales, marca_id, especificaciones];

        // Ejecutamos la consulta SQL
        const result = await client.query(query, values);

        if (categorias.length > 0) {
            const queryCategorias = `
                INSERT INTO producto_categoria (producto_id, categoria_id)
                SELECT $1, unnest($2::int[]);
            `;
            await client.query(queryCategorias, [result.rows[0].id, categorias]);
        }

        await client.query('COMMIT');
        // Admin crea productos → responde con DTO admin (incluye precio_costo)
        return await obtenerProductoPorIdAdmin(result.rows[0].id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ACTUALIZAR PRODUCTO
const actualizarProducto = async (id, datosProducto) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Separar 'categorias' de los demás campos del producto
        const { categorias, ...camposRestantes } = datosProducto;

        // 2. Definir lista blanca (whitelist) de campos permitidos
        const camposPermitidos = ['name', 'descripcion', 'precio', 'precio_costo', 'descuento', 'descuento_precio', 'destacado', 'stock', 'activo', 'img_url', 'imagenes', 'marca_id', 'especificaciones'];
        
        // 3. Filtrar solo los campos que están en la lista blanca
        const camposProducto = {};
        Object.keys(camposRestantes).forEach(key => {
            if (camposPermitidos.includes(key)) {
                camposProducto[key] = camposRestantes[key];
            }
        });

        if (Object.keys(camposProducto).length > 0) {
            const keys = Object.keys(camposProducto);

            // Corrección técnica: el índice en el map debe empezar en $2 porque $1 será el ID del WHERE
            const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = [id, ...Object.values(camposProducto)];

            await client.query(
                `UPDATE producto SET ${setClause} WHERE id = $1;`,
                values
            );
        }

        if (categorias !== undefined && categorias.length > 0) {
            await client.query('DELETE FROM producto_categoria WHERE producto_id = $1', [id]);

            const queryNuevasCategorias = `
                INSERT INTO producto_categoria (producto_id, categoria_id)
                SELECT $1, unnest($2::int[]);
            `;
            await client.query(queryNuevasCategorias, [id, categorias]);
        } else if (categorias !== undefined && categorias.length === 0) {
            await client.query('DELETE FROM producto_categoria WHERE producto_id = $1', [id]);
        }

        await client.query('COMMIT');

        return await obtenerProductoPorIdAdmin(id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ELIMINAR PRODUCTO (Desactivar)
const eliminarProducto = async (id) => {
    const query = ` UPDATE producto SET activo = false WHERE id = $1 RETURNING *; `;
    const result = await pool.query(query, [id]);
    return toProductoAdminDTO(result.rows[0]);
};

// REACTIVAR PRODUCTO
const reactivarProducto = async (id) => {
    const query = ` UPDATE producto SET activo = true WHERE id = $1 RETURNING *; `;
    const result = await pool.query(query, [id]);
    return toProductoAdminDTO(result.rows[0]);
};

// OBTENER PRODUCTOS PÚBLICOS (Solo activos y CON STOCK disponible > 0)
// #7 Fix: usa toProductoPublicoDTO para no exponer precio_costo
const obtenerProductos = async (options = {}) => {
    const { incluirSinStock = false, q = '', limit } = typeof options === 'boolean' ? { incluirSinStock: options } : options;

    const conditions = ['p.activo = true'];
    const params = [];

    // Por defecto en el catálogo público solo se muestran productos con stock disponible
    if (!incluirSinStock) {
        conditions.push('p.stock > 0');
    }

    if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`(p.name ILIKE $${params.length} OR p.descripcion ILIKE $${params.length} OR m.name ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    let limitClause = '';
    if (limit && !isNaN(parseInt(limit, 10))) {
        params.push(parseInt(limit, 10));
        limitClause = `LIMIT $${params.length}`;
    }

    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        ${whereClause}
        GROUP BY p.id, m.name
        ORDER BY p.id DESC
        ${limitClause};
    `;
    const result = await pool.query(query, params);
    return result.rows.map(toProductoPublicoDTO);
};

// OBTENER PRODUCTOS PARA PANEL ADMIN (ENDPOINT DEDICADO DE INVENTARIO)
// #7 Fix: usa toProductoAdminDTO para incluir precio_costo
const obtenerProductosAdmin = async (options = {}) => {
    const { incluirInactivos = false, q = '', limit } = options;

    const conditions = [];
    const params = [];

    if (!incluirInactivos) {
        conditions.push('p.activo = true');
    }

    if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`(p.name ILIKE $${params.length} OR p.descripcion ILIKE $${params.length} OR m.name ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    let limitClause = '';
    if (limit && !isNaN(parseInt(limit, 10))) {
        params.push(parseInt(limit, 10));
        limitClause = `LIMIT $${params.length}`;
    }

    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        ${whereClause}
        GROUP BY p.id, m.name
        ORDER BY p.id DESC
        ${limitClause};
    `;
    const result = await pool.query(query, params);
    return result.rows.map(toProductoAdminDTO);
};

// OBTENER UN PRODUCTO POR ID (uso público — sin precio_costo)
// #11 Fix: fusionado en 1 sola query con LEFT JOIN en lugar de 2 queries separadas
const obtenerProductoPorId = async (id) => {
    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        WHERE p.id = $1
        GROUP BY p.id, m.name;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return toProductoPublicoDTO(result.rows[0]);
};

// OBTENER UN PRODUCTO POR ID PARA ADMIN (incluye precio_costo)
// #11 Fix: también fusionado en 1 query
const obtenerProductoPorIdAdmin = async (id) => {
    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        WHERE p.id = $1
        GROUP BY p.id, m.name;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return toProductoAdminDTO(result.rows[0]);
};

// OBTENER PRODUCTOS POR CATEGORIA (Solo activos con stock > 0)
const obtenerProductosPorCategoria = async (categoria_id) => {
    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        WHERE pc.categoria_id = $1 AND p.activo = true AND p.stock > 0
        GROUP BY p.id, m.name;
    `;
    const result = await pool.query(query, [categoria_id]);
    return result.rows.map(toProductoPublicoDTO);
};

// OBTENER PRODUCTOS POR MARCA (Solo activos con stock > 0)
const obtenerProductosPorMarca = async (marca_id) => {
    const query = `
        SELECT p.*,
               m.name AS marca,
               COALESCE(
                   json_agg(
                       json_build_object('id', c.id, 'name', c.name)
                   ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) AS categorias
        FROM producto p
        LEFT JOIN marca m ON p.marca_id = m.id
        LEFT JOIN producto_categoria pc ON p.id = pc.producto_id
        LEFT JOIN categoria c ON pc.categoria_id = c.id
        WHERE p.marca_id = $1 AND p.activo = true AND p.stock > 0
        GROUP BY p.id, m.name;
    `;
    const result = await pool.query(query, [marca_id]);
    return result.rows.map(toProductoPublicoDTO);
};

module.exports = { 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto, 
    reactivarProducto, 
    obtenerProductos, 
    obtenerProductosAdmin, 
    obtenerProductoPorId,
    obtenerProductoPorIdAdmin,
    obtenerProductosPorCategoria, 
    obtenerProductosPorMarca 
};