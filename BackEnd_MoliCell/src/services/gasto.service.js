const pool = require('../config/db');
const { gastoToResponseDTO } = require('../dtos/gasto.dto');
const { obtenerRangoFinanciero } = require('../utils/periodoFinanciero');

const crearGasto = async (data) => {
    const { categoria, descripcion, monto, fecha, proveedor = null, comprobante = null, notas = null } = data;
    const result = await pool.query(`
        INSERT INTO gasto (categoria, descripcion, monto, fecha, proveedor, comprobante, notas)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `, [categoria, descripcion, monto, fecha, proveedor || null, comprobante || null, notas || null]);
    return gastoToResponseDTO(result.rows[0]);
};

const listarGastos = async (params = {}) => {
    const rango = obtenerRangoFinanciero(params);
    const values = [rango.desde, rango.hasta];
    const conditions = ['fecha BETWEEN $1 AND $2'];

    if (params.categoria && params.categoria !== 'todas') {
        values.push(params.categoria);
        conditions.push(`categoria = $${values.length}`);
    }
    if (params.search) {
        values.push(`%${params.search.toLowerCase()}%`);
        conditions.push(`(LOWER(descripcion) LIKE $${values.length} OR LOWER(COALESCE(proveedor, '')) LIKE $${values.length} OR LOWER(COALESCE(comprobante, '')) LIKE $${values.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const summaryResult = await pool.query(`
        SELECT COUNT(*)::int AS total_items, COALESCE(SUM(monto), 0) AS total_monto
        FROM gasto ${where};
    `, values);

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const offset = (page - 1) * limit;
    const listValues = [...values, limit, offset];
    const result = await pool.query(`
        SELECT * FROM gasto ${where}
        ORDER BY fecha DESC, id DESC
        LIMIT $${listValues.length - 1} OFFSET $${listValues.length};
    `, listValues);

    const totalItems = Number(summaryResult.rows[0].total_items) || 0;
    return {
        gastos: result.rows.map(gastoToResponseDTO),
        resumen: {
            total_monto: Number(summaryResult.rows[0].total_monto) || 0,
            cantidad: totalItems,
            promedio: totalItems ? Number(summaryResult.rows[0].total_monto) / totalItems : 0,
            ...rango
        },
        pagination: { totalItems, totalPages: Math.ceil(totalItems / limit) || 1, currentPage: page, limit }
    };
};

const actualizarGasto = async (id, data) => {
    const allowed = ['categoria', 'descripcion', 'monto', 'fecha', 'proveedor', 'comprobante', 'notas'];
    const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
    const values = [id, ...entries.map(([, value]) => value === '' ? null : value)];
    const set = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
    const result = await pool.query(`
        UPDATE gasto SET ${set}, actualizado_en = NOW() WHERE id = $1 RETURNING *;
    `, values);
    return gastoToResponseDTO(result.rows[0]);
};

const eliminarGasto = async (id) => {
    const result = await pool.query('DELETE FROM gasto WHERE id = $1 RETURNING *;', [id]);
    return gastoToResponseDTO(result.rows[0]);
};

module.exports = { crearGasto, listarGastos, actualizarGasto, eliminarGasto };
