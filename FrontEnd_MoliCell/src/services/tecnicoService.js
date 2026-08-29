import apiClient from './apiClient';

/**
 * Servicio para consumir la API de Servicio Técnico / Ordenes de Reparación
 */
export const tecnicoService = {
  /**
   * Consultar estado de reparación por código de seguimiento (Público)
   * GET /tecnico/seguimiento/:codigo
   */
  consultarSeguimiento: async (codigo) => {
    return await apiClient.get(`/tecnico/seguimiento/${codigo}`);
  },

  /**
   * Obtener todas las órdenes de servicio técnico (Admin) — con paginación
   * GET /tecnico?page=1&limit=20&search=...&estado=...
   */
  obtenerServiciosTecnicos: async (params = {}) => {
    return await apiClient.get('/tecnico', { params });
  },

  /**
   * Crear nueva orden de servicio técnico
   * POST /tecnico
   */
  crearServicioTecnico: async (datos) => {
    return await apiClient.post('/tecnico', datos);
  },

  /**
   * Actualizar estado o datos de una orden de servicio técnico (Admin)
   * PATCH /tecnico/:id
   */
  actualizarServicioTecnico: async (id, datos) => {
    return await apiClient.patch(`/tecnico/${id}`, datos);
  },

  /**
   * Eliminar una orden de servicio técnico (Admin)
   * DELETE /tecnico/:id
   */
  eliminarServicioTecnico: async (id) => {
    return await apiClient.delete(`/tecnico/${id}`);
  }
};

export default tecnicoService;
