const express = require('express');
const Router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const categoriaController = require('../controllers/categoria.controller');

// Rutas protegidas (admin)
Router.post('/', authMiddleware, categoriaController.crearCategoria);
Router.put('/:id', authMiddleware, categoriaController.actualizarCategoria);
Router.delete('/:id', authMiddleware, categoriaController.eliminarCategoria);

// Rutas públicas
Router.get('/', categoriaController.obtenerCategorias);
Router.get('/:id', categoriaController.obtenerCategoriaPorId);

module.exports = Router;