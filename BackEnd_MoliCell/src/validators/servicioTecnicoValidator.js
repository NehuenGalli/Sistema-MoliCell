const Joi = require('joi');

const ESTADOS_SERVICIO = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En Proceso',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado'
};
const valoresEstados = Object.values(ESTADOS_SERVICIO);

const crearServicioTecnicoSchema = Joi.object({
    codigo_seguimiento: Joi.string().trim().uppercase().pattern(/^MC-[A-Z0-9]{6,16}$/).optional(),
    cliente_nombre: Joi.string().trim().min(1).max(100).required(),
    cliente_telefono: Joi.string().trim().max(50).allow('', null).optional(),
    dispositivo: Joi.string().trim().min(1).max(100).required(),
    falla_descripcion: Joi.string().trim().min(1).max(5000).required(),
    presupuesto_estimado: Joi.number().min(0).required(),
    estado: Joi.string().valid(...valoresEstados).default(ESTADOS_SERVICIO.PENDIENTE)
});

const actualizarServicioTecnicoSchema = Joi.object({
    id: Joi.number().integer().positive().optional(),
    codigo_seguimiento: Joi.forbidden(),
    cliente_nombre: Joi.string().trim().min(1).max(100).optional(),
    cliente_telefono: Joi.string().trim().max(50).allow('', null).optional(),
    dispositivo: Joi.string().trim().min(1).max(100).optional(),
    falla_descripcion: Joi.string().trim().min(1).max(5000).optional(),
    presupuesto_estimado: Joi.number().min(0).optional(),
    estado: Joi.string().valid(...valoresEstados).optional()
}).min(1);

module.exports = {
    crearServicioTecnicoSchema,
    actualizarServicioTecnicoSchema,
    ESTADOS_SERVICIO,
    valoresEstados
};
