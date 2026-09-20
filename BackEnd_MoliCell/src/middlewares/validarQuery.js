const validarQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({
            error: 'Parámetros de consulta inválidos',
            detalles: error.details.map((detail) => detail.message)
        });
    }
    req.validatedQuery = value;
    return next();
};

module.exports = validarQuery;
