const Joi = require('joi');

const exactDate = Joi.string().custom((value, helpers) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return helpers.error('string.pattern.base');
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toISOString().slice(0, 10) === value ? value : helpers.error('date.base');
}, 'fecha exacta');

const fields = {
    persona_nombre: Joi.string().trim().min(2).max(120),
    telefono: Joi.string().trim().max(50).allow('', null),
    concepto: Joi.string().trim().min(2).max(240),
    origen: Joi.string().valid('Venta', 'Servicio', 'Otro'),
    referencia: Joi.string().trim().max(80).allow('', null),
    monto_total: Joi.number().positive().precision(2),
    fecha: exactDate,
    vencimiento: exactDate.allow('', null),
    notas: Joi.string().trim().max(2000).allow('', null)
};

const crearDeudaSchema = Joi.object({
    persona_nombre: fields.persona_nombre.required(),
    telefono: fields.telefono.optional(),
    concepto: fields.concepto.required(),
    origen: fields.origen.required(),
    referencia: fields.referencia.optional(),
    monto_total: fields.monto_total.required(),
    fecha: fields.fecha.required(),
    vencimiento: fields.vencimiento.optional(),
    notas: fields.notas.optional()
});
const actualizarDeudaSchema = Joi.object(fields).min(1);
const registrarPagoSchema = Joi.object({
    monto: Joi.number().positive().precision(2).required(),
    fecha: exactDate.required(),
    notas: Joi.string().trim().max(500).allow('', null).optional()
});
const listarDeudasSchema = Joi.object({
    estado: Joi.string().valid('todas', 'Pendiente', 'Parcial', 'Pagada', 'activas').default('activas'),
    origen: Joi.string().valid('todos', 'Venta', 'Servicio', 'Otro').default('todos'),
    search: Joi.string().trim().max(100).allow('').default(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = { crearDeudaSchema, actualizarDeudaSchema, registrarPagoSchema, listarDeudasSchema };
