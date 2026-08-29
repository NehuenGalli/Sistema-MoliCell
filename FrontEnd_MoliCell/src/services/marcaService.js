import apiClient from './apiClient';

/**
 * Servicio para consumir la API de Marcas del Backend
 */
export const marcaService = {
  /**
   * Obtener todas las marcas
   * GET /marca
   */
  obtenerMarcas: async () => {
    return await apiClient.get('/marca');
  },

  /**
   * Obtener marca por ID
   * GET /marca/:id
   */
  obtenerMarcaPorId: async (id) => {
    return await apiClient.get(`/marca/${id}`);
  },

  /**
   * Crear nueva marca (Admin)
   * POST /marca
   */
  crearMarca: async (datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    return await apiClient.post('/marca', payload);
  },

  /**
   * Actualizar marca por ID (Admin)
   * PUT /marca/:id
   */
  actualizarMarca: async (id, datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    return await apiClient.put(`/marca/${id}`, payload);
  },

  /**
   * Eliminar marca por ID (Admin)
   * DELETE /marca/:id
   */
  eliminarMarca: async (id) => {
    return await apiClient.delete(`/marca/${id}`);
  }
};

export default marcaService;
