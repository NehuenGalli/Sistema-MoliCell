const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const validarSchema = require('../middlewares/validarSchema');
const { upload } = require('../middlewares/uploadMiddleware');
const { crearProductoSchema, actualizarProductoSchema } = require('../validators/productoValidator');
const prodController = require('../controllers/producto.controller');

// Middleware para preprocesar datos dinámicos enviados en multipart/form-data
const preprocesarBody = (req, res, next) => {
    if (req.body.categorias && typeof req.body.categorias === 'string') {
        try {
            req.body.categorias = JSON.parse(req.body.categorias);
        } catch (e) {
            req.body.categorias = req.body.categorias.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        }
    }
    if (req.body.especificaciones && typeof req.body.especificaciones === 'string') {
        try {
            req.body.especificaciones = JSON.parse(req.body.especificaciones);
        } catch (e) {
            req.body.especificaciones = {};
        }
    }
    if (req.body.imagenes && typeof req.body.imagenes === 'string') {
        try {
            req.body.imagenes = JSON.parse(req.body.imagenes);
        } catch (e) {
            req.body.imagenes = req.body.imagenes.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    if (req.body.precio_costo !== undefined && req.body.precio_costo !== null) {
        if (typeof req.body.precio_costo === 'string') {
            const val = parseFloat(req.body.precio_costo.trim());
            req.body.precio_costo = isNaN(val) ? 0 : val;
        }
    } else if (req.method === 'POST') {
        req.body.precio_costo = 0;
    }

    if (req.body.precio !== undefined && typeof req.body.precio === 'string') {
        const val = parseFloat(req.body.precio.trim());
        req.body.precio = isNaN(val) ? 0 : val;
    }

    if (req.body.descuento !== undefined) {
        req.body.descuento = req.body.descuento === 'true' || req.body.descuento === true;
    }

    if (req.body.descuento_precio !== undefined && req.body.descuento_precio !== null) {
        if (typeof req.body.descuento_precio === 'string') {
            const val = parseFloat(req.body.descuento_precio.trim());
            req.body.descuento_precio = isNaN(val) ? null : val;
        }
    }

    if (req.body.stock !== undefined && typeof req.body.stock === 'string') {
        const val = parseInt(req.body.stock.trim(), 10);
        req.body.stock = isNaN(val) ? 0 : val;
    }
    if (req.body.marca_id !== undefined && typeof req.body.marca_id === 'string') {
        const val = parseInt(req.body.marca_id.trim(), 10);
        req.body.marca_id = isNaN(val) ? undefined : val;
    }
    next();
};

const uploadFiles = upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'imagen_principal', maxCount: 1 }
]);

// CRUD PRODUCTOS - Rutas protegidas (admin)
router.get('/admin/todos', authMiddleware, prodController.obtenerProductosAdmin);
router.post('/', authMiddleware, uploadFiles, preprocesarBody, validarSchema(crearProductoSchema), prodController.crearProducto);
router.patch('/:id', authMiddleware, uploadFiles, preprocesarBody, validarSchema(actualizarProductoSchema), prodController.actualizarProducto);
router.patch('/:id/reactivar', authMiddleware, prodController.reactivarProducto);
router.delete('/:id', authMiddleware, prodController.eliminarProducto);

// OPERACIONES CON PRODUCTOS - Rutas públicas
router.get('/', prodController.obtenerProductos);
router.get('/:id', prodController.obtenerProductoPorId);
router.get('/categoria/:categoria_id', prodController.obtenerProductosPorCategoria);
router.get('/marca/:marca_id', prodController.obtenerProductosPorMarca);

module.exports = router;  