const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { crearVentaSchema } = require('../validators/ventaValidator');
const validarSchema = require('../middlewares/validarSchema');
const ventaController = require('../controllers/venta.controller');

// Todas las rutas de ventas son protegidas (admin)
router.post('/', authMiddleware, validarSchema(crearVentaSchema), ventaController.crearVenta);
router.get('/', authMiddleware, ventaController.obtenerVentas);
router.get('/:id', authMiddleware, ventaController.obtenerVentaPorId);
router.delete('/:id', authMiddleware, ventaController.eliminarVenta);

module.exports = router;  