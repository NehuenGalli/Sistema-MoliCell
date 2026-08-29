import apiClient from './apiClient';

/**
 * Servicio para consumir la API de Categorías del Backend
 */
export const categoriaService = {
  /**
   * Obtener todas las categorías
   * GET /categoria
   */
  obtenerCategorias: async () => {
    return await apiClient.get('/categoria');
  },

  /**
   * Obtener categoría por ID
   * GET /categoria/:id
   */
  obtenerCategoriaPorId: async (id) => {
    return await apiClient.get(`/categoria/${id}`);
  },

  /**
   * Crear nueva categoría (Admin)
   * POST /categoria
   */
  crearCategoria: async (datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    return await apiClient.post('/categoria', payload);
  },

  /**
   * Actualizar categoría por ID (Admin)
   * PUT /categoria/:id
   */
  actualizarCategoria: async (id, datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    return await apiClient.put(`/categoria/${id}`, payload);
  },

  /**
   * Eliminar categoría por ID (Admin)
   * DELETE /categoria/:id
   */
  eliminarCategoria: async (id) => {
    return await apiClient.delete(`/categoria/${id}`);
  }
};

export default categoriaService;
