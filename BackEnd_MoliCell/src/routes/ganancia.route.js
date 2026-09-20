const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const validarQuery = require('../middlewares/validarQuery');
const { obtenerGananciaSchema } = require('../validators/gananciaValidator');
const controller = require('../controllers/ganancia.controller');

const router = express.Router();
router.get('/', authMiddleware, requireAdmin, validarQuery(obtenerGananciaSchema), controller.obtener);

module.exports = router;
