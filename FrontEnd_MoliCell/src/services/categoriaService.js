import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

/**
 * Servicio para consumir la API de Categorías del Backend
 */
export const categoriaService = {
  /**
   * Obtener todas las categorías
   * GET /categoria
   */
  obtenerCategorias: async () => {
    return await cachedGet('/categoria', {}, 60000);
  },

  /**
   * Obtener categoría por ID
   * GET /categoria/:id
   */
  obtenerCategoriaPorId: async (id) => {
    return await cachedGet(`/categoria/${id}`, {}, 60000);
  },

  /**
   * Crear nueva categoría (Admin)
   * POST /categoria
   */
  crearCategoria: async (datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    const result = await apiClient.post('/categoria', payload);
    invalidateGetCache('/categoria');
    return result;
  },

  /**
   * Actualizar categoría por ID (Admin)
   * PUT /categoria/:id
   */
  actualizarCategoria: async (id, datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    const result = await apiClient.put(`/categoria/${id}`, payload);
    invalidateGetCache('/categoria');
    return result;
  },

  /**
   * Eliminar categoría por ID (Admin)
   * DELETE /categoria/:id
   */
  eliminarCategoria: async (id) => {
    const result = await apiClient.delete(`/categoria/${id}`);
    invalidateGetCache('/categoria');
    return result;
  }
};

export default categoriaService;
