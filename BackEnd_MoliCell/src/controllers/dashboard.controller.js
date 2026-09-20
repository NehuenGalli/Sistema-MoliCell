const dashboardService = require('../services/dashboard.service');

const obtenerResumen = async (req, res) => {
    try {
        const resumen = await dashboardService.obtenerResumen();
        return res.status(200).json({ data: resumen });
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener el resumen del panel' });
    }
};

module.exports = { obtenerResumen };
