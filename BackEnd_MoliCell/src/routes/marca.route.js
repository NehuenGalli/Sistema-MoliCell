const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const validarSchema = require('../middlewares/validarSchema');
const { nombreCatalogoSchema } = require('../validators/catalogoValidator');
const marcaController = require('../controllers/marca.controller');

// Rutas protegidas (admin)
router.post('/', authMiddleware, requireAdmin, validarSchema(nombreCatalogoSchema), marcaController.crearMarca);
router.put('/:id', authMiddleware, requireAdmin, validarSchema(nombreCatalogoSchema), marcaController.actualizarMarca);
router.delete('/:id', authMiddleware, requireAdmin, marcaController.eliminarMarca);

// Rutas públicas
router.get('/', marcaController.obtenerMarcas);
router.get('/:id', marcaController.obtenerMarcaPorId);

module.exports = router;
