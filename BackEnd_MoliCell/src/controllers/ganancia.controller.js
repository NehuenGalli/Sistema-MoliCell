const gananciaService = require('../services/ganancia.service');

const obtener = async (req, res) => {
    try {
        return res.json(await gananciaService.obtenerGanancias(req.validatedQuery));
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({ error: status < 500 ? error.message : 'No se pudieron calcular las ganancias.' });
    }
};

module.exports = { obtener };
