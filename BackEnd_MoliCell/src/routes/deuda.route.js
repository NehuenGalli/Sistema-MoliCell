const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const validarSchema = require('../middlewares/validarSchema');
const validarQuery = require('../middlewares/validarQuery');
const controller = require('../controllers/deuda.controller');
const { crearDeudaSchema, actualizarDeudaSchema, registrarPagoSchema, listarDeudasSchema } = require('../validators/deudaValidator');

const router = express.Router();
router.use(authMiddleware, requireAdmin);
router.get('/', validarQuery(listarDeudasSchema), controller.listar);
router.post('/', validarSchema(crearDeudaSchema), controller.crear);
router.get('/:id', controller.obtener);
router.patch('/:id', validarSchema(actualizarDeudaSchema), controller.actualizar);
router.delete('/:id', controller.eliminar);
router.post('/:id/pagos', validarSchema(registrarPagoSchema), controller.registrarPago);
router.delete('/:id/pagos/:pagoId', controller.eliminarPago);

module.exports = router;
