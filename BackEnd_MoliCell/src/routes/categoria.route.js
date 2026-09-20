const express = require('express');
const Router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/authMiddleware');
const validarSchema = require('../middlewares/validarSchema');
const { nombreCatalogoSchema } = require('../validators/catalogoValidator');
const categoriaController = require('../controllers/categoria.controller');

// Rutas protegidas (admin)
Router.post('/', authMiddleware, requireAdmin, validarSchema(nombreCatalogoSchema), categoriaController.crearCategoria);
Router.put('/:id', authMiddleware, requireAdmin, validarSchema(nombreCatalogoSchema), categoriaController.actualizarCategoria);
Router.delete('/:id', authMiddleware, requireAdmin, categoriaController.eliminarCategoria);

// Rutas públicas
Router.get('/', categoriaController.obtenerCategorias);
Router.get('/:id', categoriaController.obtenerCategoriaPorId);

module.exports = Router;
