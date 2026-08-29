const Joi = require('joi');

const crearUsuarioSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const loginUsuarioSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

module.exports = { crearUsuarioSchema, loginUsuarioSchema };
