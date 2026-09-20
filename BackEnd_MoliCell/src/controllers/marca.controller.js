const marcaService = require('../services/marca.service');
const parsearIdParam = require('../utils/parsearIdParam');

const crearMarca = async (req, res) => {
    try {
        const marca = await marcaService.crearMarca(req.body);
        res.status(201).json(marca);
    } catch (error) {        res.status(500).json({ error: 'Error al crear la marca' });
    }
};

const obtenerMarcas = async (req, res) => {
    try {
        const marcas = await marcaService.obtenerMarcas();
        res.status(200).json(marcas);
    } catch (error) {        res.status(500).json({ error: 'Error al obtener las marcas' });
    }
}

const obtenerMarcaPorId = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de marca inválido' });
        const marca = await marcaService.obtenerMarcaPorId(id);
        if (!marca) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        res.status(200).json(marca);
    } catch (error) {        res.status(500).json({ error: 'Error al obtener la marca' });
    }
}

const eliminarMarca = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de marca inválido' });
        const marca = await marcaService.eliminarMarca(id);
        if (!marca) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        res.status(200).json(marca);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Error al eliminar la marca' });
    }
}

const actualizarMarca = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de marca inválido' });
        const marca = await marcaService.actualizarMarca(id, req.body);
        if (!marca) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        res.status(200).json(marca);
    } catch (error) {        res.status(500).json({ error: 'Error al actualizar la marca' });
    }
}

module.exports = { crearMarca, obtenerMarcas, obtenerMarcaPorId, eliminarMarca, actualizarMarca };
