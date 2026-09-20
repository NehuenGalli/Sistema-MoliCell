const Joi = require('joi');

const CATEGORIAS_GASTO = ['Factura', 'Proveedor', 'Alquiler', 'Servicios', 'Impuestos', 'Sueldos', 'General', 'Otro'];
const fecha = Joi.string().custom((value, helpers) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return helpers.error('string.pattern.base');
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toISOString().slice(0, 10) === value ? value : helpers.error('date.base');
}, 'fecha exacta');

const camposGasto = {
    categoria: Joi.string().valid(...CATEGORIAS_GASTO),
    descripcion: Joi.string().trim().min(2).max(200),
    monto: Joi.number().positive().precision(2),
    fecha,
    proveedor: Joi.string().trim().max(120).allow('', null),
    comprobante: Joi.string().trim().max(80).allow('', null),
    notas: Joi.string().trim().max(2000).allow('', null)
};

const crearGastoSchema = Joi.object({
    categoria: camposGasto.categoria.required(),
    descripcion: camposGasto.descripcion.required(),
    monto: camposGasto.monto.required(),
    fecha: camposGasto.fecha.required(),
    proveedor: camposGasto.proveedor.optional(),
    comprobante: camposGasto.comprobante.optional(),
    notas: camposGasto.notas.optional()
});

const actualizarGastoSchema = Joi.object(camposGasto).min(1);

const listarGastosSchema = Joi.object({
    periodo: Joi.string().valid('dia', 'semana', 'mes', 'personalizado').default('mes'),
    fecha: fecha.optional(),
    mes: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
    desde: fecha.optional(),
    hasta: fecha.optional(),
    categoria: Joi.string().valid('todas', ...CATEGORIAS_GASTO).default('todas'),
    search: Joi.string().trim().max(100).allow('').default(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = { crearGastoSchema, actualizarGastoSchema, listarGastosSchema, CATEGORIAS_GASTO };
