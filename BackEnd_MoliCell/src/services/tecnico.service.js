const pool = require('../config/db');
const crypto = require('crypto');
const { servicioTecnicoToResponseDTO, servicioTecnicoPublicoDTO } = require('../dtos/servicoTecnico.dto');

// Función auxiliar para generar un código único aleatorio no predecible (ej. MC-8F3A29)
const generarCodigoSeguimiento = () => {
    return `MC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// CREAR SERVICIO TÉCNICO
const crearServicioTecnico = async (datosServicioTecnico) => {
    const { cliente_nombre, cliente_telefono, dispositivo, falla_descripcion, presupuesto_estimado, estado } = datosServicioTecnico;
    const codigo_seguimiento = datosServicioTecnico.codigo_seguimiento || generarCodigoSeguimiento();

    const query = `
        INSERT INTO servicio_tecnico (codigo_seguimiento, cliente_nombre, cliente_telefono, dispositivo, falla_descripcion, presupuesto_estimado, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const values = [codigo_seguimiento, cliente_nombre, cliente_telefono, dispositivo, falla_descripcion, presupuesto_estimado, estado];

    const result = await pool.query(query, values);
    return servicioTecnicoToResponseDTO(result.rows[0]);
};

// ACTUALIZAR SERVICIO TÉCNICO 
const actualizarServicioTecnico = async (id, datosServicioTecnico) => {
    const camposPermitidos = ['cliente_nombre', 'cliente_telefono', 'dispositivo', 'falla_descripcion', 'presupuesto_estimado', 'estado'];

    const camposAActualizar = {};
    Object.keys(datosServicioTecnico).forEach(key => {
        if (camposPermitidos.includes(key)) {
            camposAActualizar[key] = datosServicioTecnico[key];
        }
    });

    if (Object.keys(camposAActualizar).length === 0) {
        return await obtenerServicioTecnicoPorId(id);
    }

    const keys = Object.keys(camposAActualizar);
    // Ahora es seguro porque 'keys' solo contiene valores de 'camposPermitidos'
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(camposAActualizar)];

    const query = `
        UPDATE servicio_tecnico 
        SET ${setClause}
        WHERE id = $1
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    return servicioTecnicoToResponseDTO(result.rows[0]);
};

// ELIMINAR SERVICIO TÉCNICO
const eliminarServicioTecnico = async (id) => {
    const query = ` DELETE FROM servicio_tecnico WHERE id = $1 RETURNING *; `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    return servicioTecnicoToResponseDTO(result.rows[0]);
};

// OBTENER TODOS LOS SERVICIOS TÉCNICOS (Admin) — con paginación y búsqueda
// #10 Fix: implementa paginación para no traer toda la tabla de una
const obtenerServiciosTecnicos = async (params = {}) => {
    const { search = '', estado: estadoFiltro = '', page = 1, limit = 20 } = params;

    const conditions = [];
    const values = [];

    if (search && search.trim()) {
        values.push(`%${search.trim().toLowerCase()}%`);
        conditions.push(`(LOWER(st.codigo_seguimiento) LIKE $${values.length} OR LOWER(st.cliente_nombre) LIKE $${values.length} OR LOWER(st.dispositivo) LIKE $${values.length})`);
    }

    if (estadoFiltro && estadoFiltro !== 'todos') {
        values.push(estadoFiltro);
        conditions.push(`st.estado = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Conteo total para paginación
    const countQuery = `SELECT COUNT(*) AS total FROM servicio_tecnico st ${whereClause};`;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0]?.total || 0, 10);

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const queryValues = [...values];
    queryValues.push(limitNum);
    const limitIndex = queryValues.length;
    queryValues.push(offset);
    const offsetIndex = queryValues.length;

    const query = `
        SELECT * FROM servicio_tecnico st
        ${whereClause}
        ORDER BY st.creado_en DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex};
    `;
    const result = await pool.query(query, queryValues);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return {
        servicios: result.rows.map(servicioTecnicoToResponseDTO),
        pagination: {
            totalItems,
            totalPages,
            currentPage: pageNum,
            limit: limitNum
        }
    };
};

// OBTENER UN SERVICIO TÉCNICO POR ID (Admin)
const obtenerServicioTecnicoPorId = async (id) => {
    const query = ` SELECT * FROM servicio_tecnico WHERE id = $1; `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    return servicioTecnicoToResponseDTO(result.rows[0]);
};

// OBTENER SERVICIO TÉCNICO POR CÓDIGO DE SEGUIMIENTO (Consulta Pública de Clientes)
const obtenerServicioTecnicoPorCodigo = async (codigo) => {
    const query = ` SELECT * FROM servicio_tecnico WHERE UPPER(codigo_seguimiento) = UPPER($1); `;
    const result = await pool.query(query, [codigo]);
    if (result.rows.length === 0) return null;

    return servicioTecnicoPublicoDTO(result.rows[0]);
};

module.exports = {
    crearServicioTecnico,
    actualizarServicioTecnico,
    eliminarServicioTecnico,
    obtenerServiciosTecnicos,
    obtenerServicioTecnicoPorId,
    obtenerServicioTecnicoPorCodigo
};
