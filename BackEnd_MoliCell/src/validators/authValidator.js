const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'El email no tiene un formato válido',
        'any.required': 'El email es obligatorio'
    }),
    password: Joi.string().required().messages({
        'any.required': 'La contraseña es obligatoria'
    })
});

module.exports = { loginSchema };
