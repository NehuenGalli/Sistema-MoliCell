const productoService = require('../services/producto.service');
const { subirACloudinary } = require('../middlewares/uploadMiddleware');

// #8 Helper: valida que un param sea un entero positivo
const parsearIdParam = (valor) => {
    const num = parseInt(valor, 10);
    return (!isNaN(num) && num > 0) ? num : null;
};

const crearProducto = async (req, res) => {
    try {
        let imagenesUrls = Array.isArray(req.body.imagenes) ? [...req.body.imagenes] : [];

        let files = [];
        if (req.files) {
            if (Array.isArray(req.files)) {
                files = req.files;
            } else {
                files = [...(req.files.imagenes || []), ...(req.files.imagen_principal || [])];
            }
        } else if (req.file) {
            files = [req.file];
        }

        for (const file of files) {
            const url = await subirACloudinary(file.buffer, 'molicell_productos', file.mimetype);
            imagenesUrls.push(url);
        }

        if (imagenesUrls.length > 0) {
            req.body.imagenes = imagenesUrls;
            if (!req.body.img_url) {
                req.body.img_url = imagenesUrls[0];
            }
        }

        const producto = await productoService.crearProducto(req.body);
        res.status(201).json(producto);
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(400).json({ error: error.message || 'Error al crear el producto' });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        let imagenesSubidas = [];
        let files = [];
        if (req.files) {
            if (Array.isArray(req.files)) {
                files = req.files;
            } else {
                files = [...(req.files.imagenes || []), ...(req.files.imagen_principal || [])];
            }
        } else if (req.file) {
            files = [req.file];
        }

        for (const file of files) {
            const url = await subirACloudinary(file.buffer, 'molicell_productos', file.mimetype);
            imagenesSubidas.push(url);
        }

        if (imagenesSubidas.length > 0 || req.body.imagenes !== undefined) {
            const imagenesExistentes = Array.isArray(req.body.imagenes) ? req.body.imagenes : [];
            const imagenesFinales = [...imagenesExistentes, ...imagenesSubidas];
            req.body.imagenes = imagenesFinales;
            if (imagenesFinales.length > 0 && !req.body.img_url) {
                req.body.img_url = imagenesFinales[0];
            }
        }

        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
        const producto = await productoService.actualizarProducto(id, req.body);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
        const producto = await productoService.eliminarProducto(id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

const reactivarProducto = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
        const producto = await productoService.reactivarProducto(id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al reactivar el producto' });
    }
};

const obtenerProductos = async (req, res) => {
    try {
        const incluirSinStock = req.query.incluirSinStock === 'true' || req.query.incluirSinStock === '1';
        const q = req.query.q || req.query.search || '';
        const limit = req.query.limit;

        const productos = await productoService.obtenerProductos({ incluirSinStock, q, limit });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

const obtenerProductosAdmin = async (req, res) => {
    try {
        const incluirInactivos = req.query.incluirInactivos === 'true' || req.query.incluirInactivos === '1';
        const q = req.query.q || req.query.search || '';
        const limit = req.query.limit;

        const productos = await productoService.obtenerProductosAdmin({ incluirInactivos, q, limit });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos para administración' });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const id = parsearIdParam(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
        const producto = await productoService.obtenerProductoPorId(id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
};

const obtenerProductosPorCategoria = async (req, res) => {
    try {
        const categoriaId = parsearIdParam(req.params.categoria_id);
        if (!categoriaId) return res.status(400).json({ error: 'ID de categoría inválido' });
        const productos = await productoService.obtenerProductosPorCategoria(categoriaId);
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

const obtenerProductosPorMarca = async (req, res) => {
    try {
        const marcaId = parsearIdParam(req.params.marca_id);
        if (!marcaId) return res.status(400).json({ error: 'ID de marca inválido' });
        const productos = await productoService.obtenerProductosPorMarca(marcaId);
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

module.exports = { 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto, 
    reactivarProducto, 
    obtenerProductos, 
    obtenerProductosAdmin, 
    obtenerProductoPorId, 
    obtenerProductosPorCategoria, 
    obtenerProductosPorMarca 
};
