// DTO PÚBLICO — Para el catálogo de la tienda (no expone precio_costo ni datos internos)
const toProductoPublicoDTO = (producto) => {
    if (!producto) return null;
    const imagenesArr = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
        ? producto.imagenes
        : (producto.img_url ? [producto.img_url] : []);

    const primaryCat = Array.isArray(producto.categorias) && producto.categorias.length > 0
        ? (typeof producto.categorias[0] === 'object' ? producto.categorias[0].name : producto.categorias[0])
        : (producto.categoria || null);

    return {
        id: producto.id,
        name: producto.name,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        descuento: producto.descuento,
        descuento_precio: producto.descuento_precio ? Number(producto.descuento_precio) : null,
        destacado: Boolean(producto.destacado),
        stock: producto.stock,
        activo: producto.activo,
        img_url: producto.img_url || (imagenesArr.length > 0 ? imagenesArr[0] : null),
        imagenes: imagenesArr,
        marca_id: producto.marca_id,
        marca: producto.marca || null,
        categoria: primaryCat,
        especificaciones: producto.especificaciones || {},
        categorias: producto.categorias || [],
        creado_en: producto.creado_en
    };
};

// DTO ADMIN — Para el panel de administración (incluye precio_costo para calcular márgenes)
const toProductoAdminDTO = (producto) => {
    if (!producto) return null;
    const imagenesArr = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
        ? producto.imagenes
        : (producto.img_url ? [producto.img_url] : []);

    const primaryCat = Array.isArray(producto.categorias) && producto.categorias.length > 0
        ? (typeof producto.categorias[0] === 'object' ? producto.categorias[0].name : producto.categorias[0])
        : (producto.categoria || null);

    return {
        id: producto.id,
        name: producto.name,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        precio_costo: producto.precio_costo !== null && producto.precio_costo !== undefined
            ? Number(producto.precio_costo)
            : 0,
        descuento: producto.descuento,
        descuento_precio: producto.descuento_precio ? Number(producto.descuento_precio) : null,
        destacado: Boolean(producto.destacado),
        stock: producto.stock,
        activo: producto.activo,
        img_url: producto.img_url || (imagenesArr.length > 0 ? imagenesArr[0] : null),
        imagenes: imagenesArr,
        marca_id: producto.marca_id,
        marca: producto.marca || null,
        categoria: primaryCat,
        especificaciones: producto.especificaciones || {},
        categorias: producto.categorias || [],
        creado_en: producto.creado_en
    };
};

// Alias de compatibilidad — mantiene el nombre anterior para no romper imports existentes
// Apunta al DTO admin (comportamiento original)
const toProductoResponseDTO = toProductoAdminDTO;

module.exports = {
    toProductoResponseDTO,
    toProductoPublicoDTO,
    toProductoAdminDTO,
};
