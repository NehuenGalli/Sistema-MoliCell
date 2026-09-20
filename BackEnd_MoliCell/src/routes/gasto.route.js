const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const validarSchema = require('../middlewares/validarSchema');
const validarQuery = require('../middlewares/validarQuery');
const gastoController = require('../controllers/gasto.controller');
const { crearGastoSchema, actualizarGastoSchema, listarGastosSchema } = require('../validators/gastoValidator');

const router = express.Router();
router.use(authMiddleware, requireAdmin);
router.get('/', validarQuery(listarGastosSchema), gastoController.listarGastos);
router.post('/', validarSchema(crearGastoSchema), gastoController.crearGasto);
router.patch('/:id', validarSchema(actualizarGastoSchema), gastoController.actualizarGasto);
router.delete('/:id', gastoController.eliminarGasto);

module.exports = router;
