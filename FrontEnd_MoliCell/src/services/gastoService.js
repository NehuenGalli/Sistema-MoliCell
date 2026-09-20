import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

export const gastoService = {
  obtenerGastos: (params = {}) => cachedGet('/gasto', { params }, 2000),
  crearGasto: async (data) => {
    const result = await apiClient.post('/gasto', data);
    invalidateGetCache('/gasto');
    invalidateGetCache('/ganancia');
    return result?.data || result;
  },
  actualizarGasto: async (id, data) => {
    const result = await apiClient.patch(`/gasto/${id}`, data);
    invalidateGetCache('/gasto');
    invalidateGetCache('/ganancia');
    return result?.data || result;
  },
  eliminarGasto: async (id) => {
    const result = await apiClient.delete(`/gasto/${id}`);
    invalidateGetCache('/gasto');
    invalidateGetCache('/ganancia');
    return result?.data || result;
  },
};

export default gastoService;
