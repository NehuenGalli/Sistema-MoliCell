const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const marcaController = require('../controllers/marca.controller');

// Rutas protegidas (admin)
router.post('/', authMiddleware, marcaController.crearMarca);
router.put('/:id', authMiddleware, marcaController.actualizarMarca);
router.delete('/:id', authMiddleware, marcaController.eliminarMarca);

// Rutas públicas
router.get('/', marcaController.obtenerMarcas);
router.get('/:id', marcaController.obtenerMarcaPorId);

module.exports = router;