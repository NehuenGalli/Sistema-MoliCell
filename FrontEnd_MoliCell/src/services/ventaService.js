import apiClient from './apiClient';

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
    return await apiClient.get('/venta', { params });
  },

  /**
   * Registrar una nueva venta (Cobro / Checkout)
   * POST /venta
   * Body esperado: { monto, metodo_pago, productos: [ { producto_id, cantidad } ] }
   */
  crearVenta: async (datosVenta) => {
    return await apiClient.post('/venta', datosVenta);
  }
};

export default ventaService;
