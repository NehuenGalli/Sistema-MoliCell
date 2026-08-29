const Joi = require('joi');

const ESTADOS_SERVICIO = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En Proceso',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado'
};
const valoresEstados = Object.values(ESTADOS_SERVICIO);

const crearServicioTecnicoSchema = Joi.object({
    codigo_seguimiento: Joi.string().optional(),
    cliente_nombre: Joi.string().required(),
    cliente_telefono: Joi.string().allow('', null).optional(),
    dispositivo: Joi.string().required(),
    falla_descripcion: Joi.string().required(),
    presupuesto_estimado: Joi.number().positive().required(),
    estado: Joi.string().valid(...valoresEstados).default(ESTADOS_SERVICIO.PENDIENTE)
});

const actualizarServicioTecnicoSchema = Joi.object({
    id: Joi.number().integer().positive().optional(),
    codigo_seguimiento: Joi.string().optional(),
    cliente_nombre: Joi.string().optional(),
    cliente_telefono: Joi.string().allow('', null).optional(),
    dispositivo: Joi.string().optional(),
    falla_descripcion: Joi.string().optional(),
    presupuesto_estimado: Joi.number().positive().optional(),
    estado: Joi.string().valid(...valoresEstados).optional()
});

module.exports = {
    crearServicioTecnicoSchema,
    actualizarServicioTecnicoSchema,
    ESTADOS_SERVICIO,
    valoresEstados
};