const Joi = require('joi');

const crearVentaSchema = Joi.object({
    codigo_venta: Joi.string().trim().optional(),
    monto: Joi.number().positive().required(),
    productos: Joi.array().items(
        Joi.object({
            producto_id: Joi.number().integer().positive().required(),
            cantidad: Joi.number().integer().positive().required()
        })
    ).required(),
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