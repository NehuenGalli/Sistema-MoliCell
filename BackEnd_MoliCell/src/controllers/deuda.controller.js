const deudaService = require('../services/deuda.service');
const parsearIdParam = require('../utils/parsearIdParam');

const respondError = (res, error, fallback) => res.status(error.status || 500).json({ error: error.status ? error.message : fallback });
const idFrom = (value) => parsearIdParam(value);

const crear = async (req, res) => {
    try { return res.status(201).json({ data: await deudaService.crearDeuda(req.body) }); }
    catch (error) { return respondError(res, error, 'No se pudo registrar la deuda.'); }
};
const listar = async (req, res) => {
    try { return res.json(await deudaService.listarDeudas(req.validatedQuery)); }
    catch (error) { return respondError(res, error, 'No se pudieron obtener las deudas.'); }
};
const obtener = async (req, res) => {
    try {
        const id = idFrom(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de deuda inválido.' });
        const data = await deudaService.obtenerDeuda(id);
        return data ? res.json({ data }) : res.status(404).json({ error: 'Deuda no encontrada.' });
    } catch (error) { return respondError(res, error, 'No se pudo obtener la deuda.'); }
};
const actualizar = async (req, res) => {
    try {
        const id = idFrom(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de deuda inválido.' });
        const data = await deudaService.actualizarDeuda(id, req.body);
        return data ? res.json({ data }) : res.status(404).json({ error: 'Deuda no encontrada.' });
    } catch (error) { return respondError(res, error, 'No se pudo actualizar la deuda.'); }
};
const registrarPago = async (req, res) => {
    try {
        const id = idFrom(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de deuda inválido.' });
        const data = await deudaService.registrarPago(id, req.body);
        return data ? res.status(201).json({ data }) : res.status(404).json({ error: 'Deuda no encontrada.' });
    } catch (error) { return respondError(res, error, 'No se pudo registrar el pago.'); }
};
const eliminarPago = async (req, res) => {
    try {
        const deudaId = idFrom(req.params.id);
        const pagoId = idFrom(req.params.pagoId);
        if (!deudaId || !pagoId) return res.status(400).json({ error: 'ID inválido.' });
        const data = await deudaService.eliminarPago(deudaId, pagoId);
        return data ? res.json({ data }) : res.status(404).json({ error: 'Pago no encontrado.' });
    } catch (error) { return respondError(res, error, 'No se pudo eliminar el pago.'); }
};
const eliminar = async (req, res) => {
    try {
        const id = idFrom(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de deuda inválido.' });
        const data = await deudaService.eliminarDeuda(id);
        return data ? res.json({ data }) : res.status(404).json({ error: 'Deuda no encontrada.' });
    } catch (error) { return respondError(res, error, 'No se pudo eliminar la deuda.'); }
};

module.exports = { crear, listar, obtener, actualizar, registrarPago, eliminarPago, eliminar };
