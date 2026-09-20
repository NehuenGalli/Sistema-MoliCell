import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

/**
 * Servicio para consumir la API de Servicio Técnico / Ordenes de Reparación
 */
export const tecnicoService = {
  /**
   * Consultar estado de reparación por código de seguimiento (Público)
   * GET /tecnico/seguimiento/:codigo
   */
  consultarSeguimiento: async (codigo) => {
    return await cachedGet(`/tecnico/seguimiento/${encodeURIComponent(codigo)}`, {}, 5000);
  },

  /**
   * Obtener todas las órdenes de servicio técnico (Admin) — con paginación
   * GET /tecnico?page=1&limit=20&search=...&estado=...
   */
  obtenerServiciosTecnicos: async (params = {}) => {
    return await cachedGet('/tecnico', { params }, 2000);
  },

  /**
   * Crear nueva orden de servicio técnico
   * POST /tecnico
   */
  crearServicioTecnico: async (datos) => {
    const result = await apiClient.post('/tecnico', datos);
    invalidateGetCache('/tecnico');
    invalidateGetCache('/dashboard');
    return result;
  },

  /**
   * Actualizar estado o datos de una orden de servicio técnico (Admin)
   * PATCH /tecnico/:id
   */
  actualizarServicioTecnico: async (id, datos) => {
    const result = await apiClient.patch(`/tecnico/${id}`, datos);
    invalidateGetCache('/tecnico');
    invalidateGetCache('/dashboard');
    return result;
  },

  /**
   * Eliminar una orden de servicio técnico (Admin)
   * DELETE /tecnico/:id
   */
  eliminarServicioTecnico: async (id) => {
    const result = await apiClient.delete(`/tecnico/${id}`);
    invalidateGetCache('/tecnico');
    invalidateGetCache('/dashboard');
    return result;
  }
};

export default tecnicoService;
