const Joi = require('joi');

const crearProductoSchema = Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    descripcion: Joi.string().max(5000).allow('', null).optional(),
    precio: Joi.number().positive().required(),
    precio_costo: Joi.number().min(0).allow(null).optional().default(0),
    descuento: Joi.boolean().default(false),
    descuento_precio: Joi.number().positive().allow(null).optional(),
    destacado: Joi.boolean().default(false),
    stock: Joi.number().integer().min(0).default(0), // Permite stock 0
    activo: Joi.boolean().default(true),
    img_url: Joi.string().uri({ scheme: ['https'] }).max(2048).allow('', null).optional(),
    imagenes: Joi.array().max(10).items(Joi.string().uri({ scheme: ['https'] }).max(2048)).optional(),
    marca_id: Joi.number().integer().positive().required(),
    especificaciones: Joi.object().pattern(
        Joi.string().max(50).trim(),
        Joi.string().max(150).trim().allow('')
    ).max(30).optional(),
    categorias: Joi.array().max(30).unique().items(Joi.number().integer().positive()).optional()
});

const actualizarProductoSchema = Joi.object({
    name: Joi.string().trim().min(1).max(150).optional(),
    descripcion: Joi.string().max(5000).allow('', null).optional(),
    precio: Joi.number().positive().optional(),
    precio_costo: Joi.number().min(0).allow(null).optional(),
    descuento: Joi.boolean().optional(),
    descuento_precio: Joi.number().positive().allow(null).optional(),
    destacado: Joi.boolean().optional(),
    stock: Joi.number().integer().min(0).optional(),
    activo: Joi.boolean().optional(),
    img_url: Joi.string().uri({ scheme: ['https'] }).max(2048).allow('', null).optional(),
    imagenes: Joi.array().max(10).items(Joi.string().uri({ scheme: ['https'] }).max(2048)).optional(),
    marca_id: Joi.number().integer().positive().optional(),
    especificaciones: Joi.object().pattern(
        Joi.string().max(50).trim(),
        Joi.string().max(150).trim().allow('')
    ).max(30).optional(),
    categorias: Joi.array().max(30).unique().items(Joi.number().integer().positive()).optional()
}).min(1); // Al menos un campo debe estar presente para actualizar

module.exports = { crearProductoSchema, actualizarProductoSchema };
