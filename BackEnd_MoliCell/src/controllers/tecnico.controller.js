const tecnicoService = require('../services/tecnico.service');
const parsearIdParam = require('../utils/parsearIdParam');

const crearServicioTecnico = async (req, res) => {
    try {
        const servicioTecnico = await tecnicoService.crearServicioTecnico(req.body);
        res.status(201).json(servicioTecnico);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el servicio técnico' });
    }
};

const actualizarServicioTecnico = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de servicio técnico inválido' });
        const servicioTecnico = await tecnicoService.actualizarServicioTecnico(id, req.body);
        if (!servicioTecnico) {
            return res.status(404).json({ error: 'Servicio técnico no encontrado' });
        }
        res.status(200).json(servicioTecnico);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el servicio técnico' });
    }
};

const eliminarServicioTecnico = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de servicio técnico inválido' });
        const servicioTecnico = await tecnicoService.eliminarServicioTecnico(id);
        if (!servicioTecnico) {
            return res.status(404).json({ error: 'Servicio técnico no encontrado' });
        }
        res.status(200).json(servicioTecnico);
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el servicio técnico' });
    }
};

// #10 Fix: pasa params de paginación/búsqueda al service
const obtenerServiciosTecnicos = async (req, res) => {
    try {
        const { search, estado, page, limit } = req.query;
        const resultado = await tecnicoService.obtenerServiciosTecnicos({ search, estado, page, limit });
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los servicios técnicos' });
    }
};

const obtenerServicioTecnicoPorId = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de servicio técnico inválido' });
        const servicioTecnico = await tecnicoService.obtenerServicioTecnicoPorId(id);
        if (!servicioTecnico) {
            return res.status(404).json({ error: 'Servicio técnico no encontrado' });
        }
        res.status(200).json(servicioTecnico);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el servicio técnico' });
    }
};

const obtenerServicioTecnicoPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        const servicioTecnico = await tecnicoService.obtenerServicioTecnicoPorCodigo(codigo);
        if (!servicioTecnico) {
            return res.status(404).json({ error: 'No se encontró ningún servicio técnico con ese código de seguimiento' });
        }
        res.status(200).json(servicioTecnico);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar el servicio técnico' });
    }
};

module.exports = { 
    crearServicioTecnico, 
    actualizarServicioTecnico, 
    eliminarServicioTecnico, 
    obtenerServiciosTecnicos, 
    obtenerServicioTecnicoPorId,
    obtenerServicioTecnicoPorCodigo
};
