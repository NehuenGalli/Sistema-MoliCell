const express = require('express');
const rateLimit = require('express-rate-limit');
const route = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { crearServicioTecnicoSchema, actualizarServicioTecnicoSchema } = require('../validators/servicioTecnicoValidator');
const validarSchema = require('../middlewares/validarSchema');
const tecnicoController = require('../controllers/tecnico.controller');

// Rate limiter para la consulta pública: máximo 5 consultas cada 10 minutos por IP
const seguimientoLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 5,
    message: { error: 'Demasiadas consultas de seguimiento. Intenta de nuevo en 10 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Ruta PÚBLICA para clientes (sin authMiddleware)
route.get('/seguimiento/:codigo', seguimientoLimiter, tecnicoController.obtenerServicioTecnicoPorCodigo);

// Rutas PROTEGIDAS para Admin
route.post('/', authMiddleware, requireAdmin, validarSchema(crearServicioTecnicoSchema), tecnicoController.crearServicioTecnico);
route.get('/', authMiddleware, requireAdmin, tecnicoController.obtenerServiciosTecnicos);
route.get('/:id', authMiddleware, requireAdmin, tecnicoController.obtenerServicioTecnicoPorId);
route.put('/:id', authMiddleware, requireAdmin, validarSchema(actualizarServicioTecnicoSchema), tecnicoController.actualizarServicioTecnico);
route.patch('/:id', authMiddleware, requireAdmin, validarSchema(actualizarServicioTecnicoSchema), tecnicoController.actualizarServicioTecnico);
route.delete('/:id', authMiddleware, requireAdmin, tecnicoController.eliminarServicioTecnico);

module.exports = route;
