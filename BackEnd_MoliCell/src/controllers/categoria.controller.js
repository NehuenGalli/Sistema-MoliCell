const categoriaService = require('../services/categoria.service');

const crearCategoria = async (req, res) => {
    try {
        const categoria = await categoriaService.crearCategoria(req.body);
        res.status(201).json(categoria);
    } catch (error) {        res.status(500).json({ error: 'Error al crear la categoria' });
    }
}

const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await categoriaService.obtenerCategorias();
        res.status(200).json(categorias);
    } catch (error) {        res.status(500).json({ error: 'Error al obtener las categorias' });
    }
}

const obtenerCategoriaPorId = async (req, res) => {
    try {
        const categoria = await categoriaService.obtenerCategoriaPorId(req.params.id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.status(200).json(categoria);
    } catch (error) {        res.status(500).json({ error: 'Error al obtener la categoria' });
    }
}

const eliminarCategoria = async (req, res) => {
    try {
        const categoria = await categoriaService.eliminarCategoria(req.params.id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.status(200).json(categoria);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Error al eliminar la categoria' });
    }
}

const actualizarCategoria = async (req, res) => {
    try {
        const categoria = await categoriaService.actualizarCategoria(req.params.id, req.body);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.status(200).json(categoria);
    } catch (error) {        res.status(500).json({ error: 'Error al actualizar la categoria' });
    }
}

module.exports = { crearCategoria, obtenerCategorias, obtenerCategoriaPorId, eliminarCategoria, actualizarCategoria };