const validarSchema = (schema) => {
    return (req, res, next) => {
        // Valida req.body contra el esquema recibido
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            // Formatea los mensajes de error de Joi
            const detalles = error.details.map(err => err.message);
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                detalles
            });
        }
        // Reemplaza req.body con los datos sanitizados por Joi
        req.body = value;
        next();
    };
};

module.exports = validarSchema;