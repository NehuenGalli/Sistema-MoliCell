const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(254).required().messages({
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'
    }),
    password: Joi.string().min(8).max(128).required().messages({
        'any.required': 'La contraseña es obligatoria'
    })
});

module.exports = { loginSchema };
