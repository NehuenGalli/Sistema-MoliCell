import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

/**
 * Servicio para consumir la API de Marcas del Backend
 */
export const marcaService = {
  /**
   * Obtener todas las marcas
   * GET /marca
   */
  obtenerMarcas: async () => {
    return await cachedGet('/marca', {}, 60000);
  },

  /**
   * Obtener marca por ID
   * GET /marca/:id
   */
  obtenerMarcaPorId: async (id) => {
    return await cachedGet(`/marca/${id}`, {}, 60000);
  },

  /**
   * Crear nueva marca (Admin)
   * POST /marca
   */
  crearMarca: async (datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    const result = await apiClient.post('/marca', payload);
    invalidateGetCache('/marca');
    return result;
  },

  /**
   * Actualizar marca por ID (Admin)
   * PUT /marca/:id
   */
  actualizarMarca: async (id, datos) => {
    const payload = typeof datos === 'string' ? { name: datos } : datos;
    const result = await apiClient.put(`/marca/${id}`, payload);
    invalidateGetCache('/marca');
    return result;
  },

  /**
   * Eliminar marca por ID (Admin)
   * DELETE /marca/:id
   */
  eliminarMarca: async (id) => {
    const result = await apiClient.delete(`/marca/${id}`);
    invalidateGetCache('/marca');
    return result;
  }
};

export default marcaService;
