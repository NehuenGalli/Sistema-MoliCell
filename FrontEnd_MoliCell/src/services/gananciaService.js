import { cachedGet } from './apiClient';

export const gananciaService = {
  obtenerGanancias: (params = {}) => cachedGet('/ganancia', { params }, 2000),
};

export default gananciaService;
