const Joi = require('joi');

const crearVentaSchema = Joi.object({
    codigo_venta: Joi.string().trim().max(30).optional(),
    // Se acepta por compatibilidad, pero el backend recalcula el total desde precios vigentes.
    monto: Joi.number().positive().optional(),
    productos: Joi.array().items(
        Joi.object({
            producto_id: Joi.number().integer().positive().required(),
            cantidad: Joi.number().integer().positive().required()
        })
    ).min(1).max(100).unique('producto_id').required(),
    metodo_pago: Joi.string().valid(
        'Efectivo', 
        'Tarjeta', 
        'Transferencia', 
        'Mercado Pago', 
        'Tarjeta de Débito', 
        'Tarjeta de Crédito', 
        'Débito', 
        'Crédito'
    ).required()
});

module.exports = { crearVentaSchema };
