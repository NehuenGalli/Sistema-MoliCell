import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

/**
 * Servicio para consumir la API de Productos del Backend
 */
export const productoService = {
  /**
   * Obtener productos públicos (solo activos con stock > 0)
   * GET /producto?q=iphone&limit=10
   */
  obtenerProductos: async (params = {}) => {
    const queryParams = typeof params === 'boolean' ? { incluirSinStock: params } : params;
    return await cachedGet('/producto', { params: queryParams }, 15000);
  },

  /**
   * Obtener productos para gestión admin (incluye stock 0 e inactivos/eliminados)
   * GET /producto/admin/todos
   */
  obtenerProductosAdmin: async (params = {}) => {
    const queryParams = typeof params === 'boolean' ? { incluirInactivos: params } : params;
    return await cachedGet('/producto/admin/todos', { params: queryParams }, 5000);
  },

  /**
   * Obtener detalle de un producto por su ID
   * GET /producto/:id
   */
  obtenerProductoPorId: async (id) => {
    return await cachedGet(`/producto/${id}`, {}, 15000);
  },

  /**
   * Obtener productos filtrados por ID de Categoría
   * GET /producto/categoria/:categoria_id
   */
  obtenerProductosPorCategoria: async (categoriaId) => {
    return await cachedGet(`/producto/categoria/${categoriaId}`, {}, 15000);
  },

  /**
   * Obtener productos filtrados por ID de Marca
   * GET /producto/marca/:marca_id
   */
  obtenerProductosPorMarca: async (marcaId) => {
    return await cachedGet(`/producto/marca/${marcaId}`, {}, 15000);
  },

  /**
   * Crear un nuevo producto (Requiere token Admin)
   * POST /producto
   * Acepa FormData o un Objeto con { name, precio, precio_costo, stock, marca_id, imagenes, especificacion, etc }
   */
  crearProducto: async (datosProducto) => {
    const payload = prepararPayloadProducto(datosProducto);
    const result = await apiClient.post('/producto', payload);
    invalidateGetCache('/producto');
    invalidateGetCache('/dashboard');
    return result;
  },

  /**
   * Actualizar un producto existente (Requiere token Admin)
   * PATCH /producto/:id
   */
  actualizarProducto: async (id, datosProducto) => {
    const payload = prepararPayloadProducto(datosProducto);
    const result = await apiClient.patch(`/producto/${id}`, payload);
    invalidateGetCache('/producto');
    invalidateGetCache('/dashboard');
    return result;
  },

  /**
   * Reactivar un producto anteriormente desactivado/eliminado (Requiere token Admin)
   * PATCH /producto/:id/reactivar
   */
  reactivarProducto: async (id) => {
    const result = await apiClient.patch(`/producto/${id}/reactivar`);
    invalidateGetCache('/producto');
    invalidateGetCache('/dashboard');
    return result;
  },

  /**
   * Eliminar (Desactivar) un producto por ID (Requiere token Admin)
   * DELETE /producto/:id
   */
  eliminarProducto: async (id) => {
    const result = await apiClient.delete(`/producto/${id}`);
    invalidateGetCache('/producto');
    invalidateGetCache('/dashboard');
    return result;
  }
};

/**
 * Convierte un objeto plano de JS a FormData si contiene archivos de imagen
 */
export function prepararPayloadProducto(datos) {
  if (datos instanceof FormData) {
    return datos;
  }

  const formData = new FormData();

  Object.keys(datos).forEach((key) => {
    const value = datos[key];
    if (value === undefined || value === null) return;

    if (key === 'imagenes' && Array.isArray(value)) {
      value.forEach((img) => {
        if (img instanceof File) {
          formData.append('imagenes', img);
        }
      });
      // Si son URLs en string, enviarlas como JSON
      const urlStrings = value.filter((img) => typeof img === 'string');
      if (urlStrings.length > 0) {
        formData.append('imagenes', JSON.stringify(urlStrings));
      }
    } else if (key === 'imagen_principal' && value instanceof File) {
      formData.append('imagen_principal', value);
    } else if (typeof value === 'object' && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });

  return formData;
}

export default productoService;
