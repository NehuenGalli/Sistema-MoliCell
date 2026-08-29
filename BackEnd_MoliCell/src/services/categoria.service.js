const pool = require('../config/db');

const crearCategoria = async (datosCategoria) => {
    const { name } = datosCategoria;
    const query = 'INSERT INTO categoria (name) VALUES ($1) RETURNING *;'
    const result = await pool.query(query, [name]);
    return result.rows[0];
}

const obtenerCategorias = async () => {
    const query = 'SELECT * FROM categoria';
    const result = await pool.query(query);
    return result.rows;
}

const obtenerCategoriaPorId = async (id) => {
    const query = 'SELECT * FROM categoria WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
}

const eliminarCategoria = async (id) => {
    const checkQuery = `
        SELECT COUNT(*) 
        FROM producto_categoria pc
        JOIN producto p ON p.id = pc.producto_id
        WHERE pc.categoria_id = $1 AND p.activo = true;
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    const count = parseInt(checkResult.rows[0].count, 10);

    if (count > 0) {
        const error = new Error(`No se puede eliminar la categoría porque hay ${count} producto(s) asignado(s) a ella.`);
        error.status = 400;
        throw error;
    }

    const query = 'DELETE FROM categoria WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const actualizarCategoria = async (id, datosCategoria) => {
    const { name } = datosCategoria;
    const query = 'UPDATE categoria SET name = $1 WHERE id = $2 RETURNING *;';
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
}

module.exports = { crearCategoria, obtenerCategorias, obtenerCategoriaPorId, eliminarCategoria, actualizarCategoria };