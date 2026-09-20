const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { crearVentaSchema } = require('../validators/ventaValidator');
const validarSchema = require('../middlewares/validarSchema');
const ventaController = require('../controllers/venta.controller');

// Todas las rutas de ventas son protegidas (admin)
router.post('/', authMiddleware, requireAdmin, validarSchema(crearVentaSchema), ventaController.crearVenta);
router.get('/', authMiddleware, requireAdmin, ventaController.obtenerVentas);
router.get('/:id', authMiddleware, requireAdmin, ventaController.obtenerVentaPorId);
router.delete('/:id', authMiddleware, requireAdmin, ventaController.eliminarVenta);

module.exports = router;
