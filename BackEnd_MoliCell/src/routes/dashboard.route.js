const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/resumen', authMiddleware, requireAdmin, dashboardController.obtenerResumen);

module.exports = router;
