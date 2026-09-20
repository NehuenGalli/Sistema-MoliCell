const Joi = require('joi');

const date = Joi.string().custom((value, helpers) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return helpers.error('string.pattern.base');
    const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return parsed.toISOString().slice(0, 10) === value ? value : helpers.error('date.base');
}, 'fecha exacta');

const obtenerGananciaSchema = Joi.object({
    periodo: Joi.string().valid('dia', 'semana', 'mes', 'personalizado').default('mes'),
    fecha: date.optional(),
    mes: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
    desde: date.optional(),
    hasta: date.optional()
});

module.exports = { obtenerGananciaSchema };
