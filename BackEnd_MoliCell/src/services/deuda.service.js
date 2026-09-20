const pool = require('../config/db');
const { deudaToResponseDTO, pagoToResponseDTO } = require('../dtos/deuda.dto');

const businessError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const crearDeuda = async (data) => {
    const { persona_nombre, telefono = null, concepto, origen, referencia = null, monto_total, fecha, vencimiento = null, notas = null } = data;
    const result = await pool.query(`
        INSERT INTO deuda (persona_nombre, telefono, concepto, origen, referencia, monto_total, fecha, vencimiento, notas)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *, 0::numeric AS monto_pagado;
    `, [persona_nombre, telefono || null, concepto, origen, referencia || null, monto_total, fecha, vencimiento || null, notas || null]);
    return deudaToResponseDTO(result.rows[0]);
};

const listarDeudas = async (params = {}) => {
    const conditions = [];
    const values = [];
    if (params.estado === 'activas') conditions.push("d.estado <> 'Pagada'");
    else if (params.estado && params.estado !== 'todas') {
        values.push(params.estado);
        conditions.push(`d.estado = $${values.length}`);
    }
    if (params.origen && params.origen !== 'todos') {
        values.push(params.origen);
        conditions.push(`d.origen = $${values.length}`);
    }
    if (params.search) {
        values.push(`%${params.search.toLowerCase()}%`);
        conditions.push(`(LOWER(d.persona_nombre) LIKE $${values.length} OR LOWER(d.concepto) LIKE $${values.length} OR LOWER(COALESCE(d.telefono,'')) LIKE $${values.length} OR LOWER(COALESCE(d.referencia,'')) LIKE $${values.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const summary = await pool.query(`
        SELECT COUNT(*)::int AS cantidad,
               COALESCE(SUM(d.monto_total),0) AS total_original,
               COALESCE(SUM(p.monto_pagado),0) AS total_cobrado,
               COALESCE(SUM(GREATEST(d.monto_total - COALESCE(p.monto_pagado,0),0)),0) AS total_pendiente
        FROM deuda d
        LEFT JOIN (SELECT deuda_id, SUM(monto) AS monto_pagado FROM deuda_pago GROUP BY deuda_id) p ON p.deuda_id = d.id
        ${where};
    `, values);
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const listValues = [...values, limit, (page - 1) * limit];
    const result = await pool.query(`
        SELECT d.*, COALESCE(SUM(dp.monto),0) AS monto_pagado
        FROM deuda d LEFT JOIN deuda_pago dp ON dp.deuda_id = d.id
        ${where}
        GROUP BY d.id ORDER BY d.fecha DESC, d.id DESC
        LIMIT $${listValues.length - 1} OFFSET $${listValues.length};
    `, listValues);
    const row = summary.rows[0];
    const totalItems = Number(row.cantidad) || 0;
    return {
        deudas: result.rows.map(deudaToResponseDTO),
        resumen: {
            cantidad: totalItems,
            total_original: Number(row.total_original) || 0,
            total_cobrado: Number(row.total_cobrado) || 0,
            total_pendiente: Number(row.total_pendiente) || 0
        },
        pagination: { totalItems, totalPages: Math.ceil(totalItems / limit) || 1, currentPage: page, limit }
    };
};

const obtenerDeuda = async (id, client = pool) => {
    const result = await client.query(`
        SELECT d.*, COALESCE(SUM(dp.monto),0) AS monto_pagado
        FROM deuda d LEFT JOIN deuda_pago dp ON dp.deuda_id = d.id
        WHERE d.id = $1 GROUP BY d.id;
    `, [id]);
    if (!result.rows[0]) return null;
    const pagos = await client.query('SELECT * FROM deuda_pago WHERE deuda_id = $1 ORDER BY fecha DESC, id DESC;', [id]);
    return deudaToResponseDTO({ ...result.rows[0], pagos: pagos.rows });
};

const actualizarDeuda = async (id, data) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const current = await client.query('SELECT * FROM deuda WHERE id = $1 FOR UPDATE;', [id]);
        if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
        const paidResult = await client.query('SELECT COALESCE(SUM(monto),0) AS monto_pagado FROM deuda_pago WHERE deuda_id = $1;', [id]);
        const paid = Number(paidResult.rows[0].monto_pagado) || 0;
        const total = data.monto_total === undefined ? Number(current.rows[0].monto_total) : Number(data.monto_total);
        if (total < paid) throw businessError('El monto total no puede ser menor que lo ya cobrado.');
        const allowed = ['persona_nombre', 'telefono', 'concepto', 'origen', 'referencia', 'monto_total', 'fecha', 'vencimiento', 'notas'];
        const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
        const estado = paid === 0 ? 'Pendiente' : (paid >= total ? 'Pagada' : 'Parcial');
        const values = [id, ...entries.map(([, value]) => value === '' ? null : value), estado];
        const set = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
        const separator = set ? `${set}, ` : '';
        await client.query(`UPDATE deuda SET ${separator}estado = $${values.length}, actualizado_en = NOW() WHERE id = $1;`, values);
        const updated = await obtenerDeuda(id, client);
        await client.query('COMMIT');
        return updated;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const registrarPago = async (id, data) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const debt = await client.query('SELECT monto_total FROM deuda WHERE id = $1 FOR UPDATE;', [id]);
        if (!debt.rows[0]) { await client.query('ROLLBACK'); return null; }
        const paidResult = await client.query('SELECT COALESCE(SUM(monto),0) AS monto_pagado FROM deuda_pago WHERE deuda_id = $1;', [id]);
        const amountPaid = Number(paidResult.rows[0].monto_pagado) || 0;
        const balance = Number(debt.rows[0].monto_total) - amountPaid;
        if (Number(data.monto) > balance) throw businessError('El pago no puede superar el saldo pendiente.');
        const payment = await client.query(`
            INSERT INTO deuda_pago (deuda_id, monto, fecha, notas) VALUES ($1,$2,$3,$4) RETURNING *;
        `, [id, data.monto, data.fecha, data.notas || null]);
        const newPaid = amountPaid + Number(data.monto);
        const estado = newPaid >= Number(debt.rows[0].monto_total) ? 'Pagada' : 'Parcial';
        await client.query('UPDATE deuda SET estado = $2, actualizado_en = NOW() WHERE id = $1;', [id, estado]);
        await client.query('COMMIT');
        return pagoToResponseDTO(payment.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const eliminarPago = async (deudaId, pagoId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const debt = await client.query('SELECT id, monto_total FROM deuda WHERE id = $1 FOR UPDATE;', [deudaId]);
        if (!debt.rows[0]) { await client.query('ROLLBACK'); return null; }
        const deleted = await client.query('DELETE FROM deuda_pago WHERE id = $1 AND deuda_id = $2 RETURNING *;', [pagoId, deudaId]);
        if (!deleted.rows[0]) { await client.query('ROLLBACK'); return null; }
        const paid = await client.query('SELECT COALESCE(SUM(monto),0) AS total FROM deuda_pago WHERE deuda_id = $1;', [deudaId]);
        const paidAmount = Number(paid.rows[0].total);
        const estado = paidAmount === 0 ? 'Pendiente' : (paidAmount >= Number(debt.rows[0].monto_total) ? 'Pagada' : 'Parcial');
        await client.query('UPDATE deuda SET estado = $2, actualizado_en = NOW() WHERE id = $1;', [deudaId, estado]);
        await client.query('COMMIT');
        return pagoToResponseDTO(deleted.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const eliminarDeuda = async (id) => {
    const result = await pool.query('DELETE FROM deuda WHERE id = $1 RETURNING *;', [id]);
    return deudaToResponseDTO(result.rows[0]);
};

module.exports = { crearDeuda, listarDeudas, obtenerDeuda, actualizarDeuda, registrarPago, eliminarPago, eliminarDeuda };
