import { cachedGet } from './apiClient';

export const dashboardService = {
  obtenerResumen: () => cachedGet('/dashboard/resumen', {}, 5000)
};

export default dashboardService;
