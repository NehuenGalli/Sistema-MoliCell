const ventaService = require('../services/venta.service');

const crearVenta = async (req, res) => {
    try {
        const venta = await ventaService.crearVenta(req.body);
        return res.status(201).json({ message: 'Venta agregada exitosamente', data: venta });
    } catch (error) {
        if (error.code === '23514' && error.constraint === 'check_stock_positivo') {
            return res.status(400).json({
                error: 'No hay stock suficiente para uno o más productos de la lista.'
            });
        }

        if (error.code === '23503' && error.detail && error.detail.includes('producto_id')) {
            return res.status(404).json({
                error: 'No se puede crear la venta porque uno o mas productos no existen.'
            });
        }

        return res.status(500).json({
            error: 'Ocurrió un error inesperado al procesar la venta.'
        });
    }
};

const obtenerVentas = async (req, res) => {
    try {
        const { ventas, pagination } = await ventaService.obtenerVentas(req.query);
        return res.status(200).json({ data: ventas, pagination });
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener ventas' });
    }
};

const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await ventaService.obtenerVentaPorId(id);
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        return res.status(200).json({ data: venta });
    } catch (error) {        return res.status(500).json({ error: 'Error al obtener venta' });
    }
};

const eliminarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await ventaService.eliminarVenta(id);
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        return res.status(200).json({ message: 'Venta eliminada exitosamente', data: venta });
    } catch (error) {        return res.status(500).json({ error: 'Error al eliminar venta' });
    }
};

module.exports = { crearVenta, obtenerVentas, obtenerVentaPorId, eliminarVenta };