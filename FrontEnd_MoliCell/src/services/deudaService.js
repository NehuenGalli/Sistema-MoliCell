import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

const invalidate = () => {
  invalidateGetCache('/deuda');
  invalidateGetCache('/ganancia');
};

export const deudaService = {
  obtenerDeudas: (params = {}) => cachedGet('/deuda', { params }, 2000),
  obtenerDeuda: async (id) => {
    const result = await cachedGet(`/deuda/${id}`, {}, 1000);
    return result?.data || result;
  },
  crearDeuda: async (data) => { const result = await apiClient.post('/deuda', data); invalidate(); return result?.data || result; },
  actualizarDeuda: async (id, data) => { const result = await apiClient.patch(`/deuda/${id}`, data); invalidate(); return result?.data || result; },
  eliminarDeuda: async (id) => { const result = await apiClient.delete(`/deuda/${id}`); invalidate(); return result?.data || result; },
  registrarPago: async (id, data) => { const result = await apiClient.post(`/deuda/${id}/pagos`, data); invalidate(); return result?.data || result; },
  eliminarPago: async (id, pagoId) => { const result = await apiClient.delete(`/deuda/${id}/pagos/${pagoId}`); invalidate(); return result?.data || result; },
};

export default deudaService;
