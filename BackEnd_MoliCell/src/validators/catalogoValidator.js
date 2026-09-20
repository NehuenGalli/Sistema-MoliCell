const Joi = require('joi');

const nombreCatalogoSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
});

module.exports = { nombreCatalogoSchema };
