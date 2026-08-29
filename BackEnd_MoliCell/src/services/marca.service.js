const pool = require('../config/db');

const crearMarca = async (datosMarca) => {
    const { name } = datosMarca;
    const query = 'INSERT INTO marca (name) VALUES ($1) RETURNING *;';
    const result = await pool.query(query, [name]);
    return result.rows[0];
};

const obtenerMarcas = async () => {
    const query = 'SELECT * FROM marca;';
    const result = await pool.query(query);
    return result.rows;
};

const obtenerMarcaPorId = async (id) => {
    const query = 'SELECT * FROM marca WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const eliminarMarca = async (id) => {
    const checkQuery = `
        SELECT COUNT(*) 
        FROM producto 
        WHERE marca_id = $1 AND activo = true;
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    const count = parseInt(checkResult.rows[0].count, 10);

    if (count > 0) {
        const error = new Error(`No se puede eliminar la marca porque hay ${count} producto(s) asignado(s) a ella.`);
        error.status = 400;
        throw error;
    }

    const query = 'DELETE FROM marca WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const actualizarMarca = async (id, datosMarca) => {
    const { name } = datosMarca;
    const query = 'UPDATE marca SET name = $1 WHERE id = $2 RETURNING *;';
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
};

module.exports = {
    crearMarca,
    obtenerMarcas,
    obtenerMarcaPorId,
    eliminarMarca,
    actualizarMarca
};