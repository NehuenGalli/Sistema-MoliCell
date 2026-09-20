const gastoService = require('../services/gasto.service');
const parsearIdParam = require('../utils/parsearIdParam');

const handleError = (res, error, fallback) => res.status(error.status || 500).json({ error: error.status ? error.message : fallback });

const crearGasto = async (req, res) => {
    try {
        return res.status(201).json({ data: await gastoService.crearGasto(req.body) });
    } catch (error) {
        return handleError(res, error, 'No se pudo registrar el gasto.');
    }
};

const listarGastos = async (req, res) => {
    try {
        return res.json(await gastoService.listarGastos(req.validatedQuery));
    } catch (error) {
        return handleError(res, error, 'No se pudieron obtener los gastos.');
    }
};

const actualizarGasto = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de gasto inválido.' });
        const gasto = await gastoService.actualizarGasto(id, req.body);
        return gasto ? res.json({ data: gasto }) : res.status(404).json({ error: 'Gasto no encontrado.' });
    } catch (error) {
        return handleError(res, error, 'No se pudo actualizar el gasto.');
    }
};

const eliminarGasto = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de gasto inválido.' });
        const gasto = await gastoService.eliminarGasto(id);
        return gasto ? res.json({ data: gasto }) : res.status(404).json({ error: 'Gasto no encontrado.' });
    } catch (error) {
        return handleError(res, error, 'No se pudo eliminar el gasto.');
    }
};

module.exports = { crearGasto, listarGastos, actualizarGasto, eliminarGasto };
