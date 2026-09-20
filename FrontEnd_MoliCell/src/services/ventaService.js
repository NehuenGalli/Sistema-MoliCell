import apiClient, { cachedGet, invalidateGetCache } from './apiClient';

/**
 * Servicio para consumir la API de Ventas / Registros de compra del Backend
 */
export const ventaService = {
  /**
   * Obtener historial de ventas registradas (Admin)
   * GET /venta
   * Params opcionales: { filtro: 'semana'|'mes', fecha: 'YYYY-MM-DD' }
   */
  obtenerVentas: async (params = {}) => {
    return await cachedGet('/venta', { params }, 2000);
  },

  /**
   * Registrar una nueva venta (Cobro / Checkout)
   * POST /venta
   * Body esperado: { monto, metodo_pago, productos: [ { producto_id, cantidad } ] }
   */
  crearVenta: async (datosVenta) => {
    const result = await apiClient.post('/venta', datosVenta);
    invalidateGetCache('/venta');
    invalidateGetCache('/producto');
    invalidateGetCache('/dashboard');
    return result;
  }
};

export default ventaService;
