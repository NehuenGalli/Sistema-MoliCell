import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAdminCategoria,
  createAdminMarca,
  createAdminProducto,
  createAdminReparacion,
  createAdminVenta,
  createAdminGasto,
  createAdminDeuda,
  createAdminDeudaPago,
  deleteAdminDeuda,
  deleteAdminDeudaPago,
  deleteAdminGasto,
  fetchAdminGastos,
  fetchAdminDeuda,
  fetchAdminDeudas,
  deleteAdminCategoria,
  deleteAdminMarca,
  deleteAdminProducto,
  deleteAdminReparacion,
  fetchAdminCategorias,
  fetchAdminMarcas,
  fetchAdminProductos,
  fetchAdminReparaciones,
  fetchAdminResumen,
  fetchAdminVentas,
  loginAdmin,
  reactivarAdminProducto,
  updateAdminProducto,
  updateAdminReparacion,
  updateAdminGasto,
  updateAdminDeuda,
} from './adminApi';
import { authService, categoriaService, dashboardService, deudaService, gastoService, marcaService, productoService, tecnicoService, ventaService } from '../../services';

vi.mock('../../services', () => ({
  authService: { login: vi.fn() },
  categoriaService: { obtenerCategorias: vi.fn(), crearCategoria: vi.fn(), eliminarCategoria: vi.fn() },
  dashboardService: { obtenerResumen: vi.fn() },
  marcaService: { obtenerMarcas: vi.fn(), crearMarca: vi.fn(), eliminarMarca: vi.fn() },
  productoService: {
    obtenerProductosAdmin: vi.fn(), crearProducto: vi.fn(), actualizarProducto: vi.fn(),
    reactivarProducto: vi.fn(), eliminarProducto: vi.fn(),
  },
  tecnicoService: {
    obtenerServiciosTecnicos: vi.fn(), crearServicioTecnico: vi.fn(),
    actualizarServicioTecnico: vi.fn(), eliminarServicioTecnico: vi.fn(),
  },
  ventaService: { obtenerVentas: vi.fn(), crearVenta: vi.fn() },
  gastoService: { obtenerGastos: vi.fn(), crearGasto: vi.fn(), actualizarGasto: vi.fn(), eliminarGasto: vi.fn() },
  deudaService: { obtenerDeudas: vi.fn(), obtenerDeuda: vi.fn(), crearDeuda: vi.fn(), actualizarDeuda: vi.fn(), eliminarDeuda: vi.fn(), registrarPago: vi.fn(), eliminarPago: vi.fn() },
}));

describe('fachada adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const services = [
      authService.login,
      categoriaService.obtenerCategorias, categoriaService.crearCategoria, categoriaService.eliminarCategoria,
      dashboardService.obtenerResumen,
      marcaService.obtenerMarcas, marcaService.crearMarca, marcaService.eliminarMarca,
      productoService.obtenerProductosAdmin, productoService.crearProducto, productoService.actualizarProducto,
      productoService.reactivarProducto, productoService.eliminarProducto,
      tecnicoService.obtenerServiciosTecnicos, tecnicoService.crearServicioTecnico,
      tecnicoService.actualizarServicioTecnico, tecnicoService.eliminarServicioTecnico,
      ventaService.obtenerVentas, ventaService.crearVenta,
      gastoService.obtenerGastos, gastoService.crearGasto, gastoService.actualizarGasto, gastoService.eliminarGasto,
      deudaService.obtenerDeudas, deudaService.obtenerDeuda, deudaService.crearDeuda, deudaService.actualizarDeuda,
      deudaService.eliminarDeuda, deudaService.registrarPago, deudaService.eliminarPago,
    ];
    services.forEach((service) => service.mockResolvedValue({ data: { id: 1 }, usuario: { id: 1 }, token: 'ignored' }));
  });

  it('normaliza login y respuestas de lectura', async () => {
    await expect(loginAdmin('a@b.com', 'password')).resolves.toEqual({ success: true, usuario: { id: 1 } });
    await fetchAdminProductos({ limit: 1 });
    await fetchAdminCategorias();
    await fetchAdminMarcas();
    await fetchAdminReparaciones({ page: 1 });
    await fetchAdminVentas({ page: 1 });
    await fetchAdminGastos({ periodo: 'mes' });
    await fetchAdminDeudas({ estado: 'activas' });
    await fetchAdminDeuda(1);
    await expect(fetchAdminResumen()).resolves.toEqual({ id: 1 });
  });

  it('delega todas las mutaciones y normaliza booleanos/datos', async () => {
    await createAdminProducto({ name: 'A' });
    await updateAdminProducto(1, { name: 'B' });
    await expect(reactivarAdminProducto(1)).resolves.toBe(true);
    await expect(deleteAdminProducto(1)).resolves.toBe(true);
    await createAdminCategoria('Cat');
    await expect(deleteAdminCategoria(1)).resolves.toBe(true);
    await createAdminMarca('Marca');
    await expect(deleteAdminMarca(1)).resolves.toBe(true);
    await createAdminReparacion({ dispositivo: 'A' });
    await updateAdminReparacion(1, { estado: 'Listo' });
    await expect(deleteAdminReparacion(1)).resolves.toBe(true);
    await expect(createAdminVenta({ productos: [] })).resolves.toEqual({ id: 1 });
    await createAdminGasto({ monto: 1 });
    await updateAdminGasto(1, { monto: 2 });
    await deleteAdminGasto(1);
    await createAdminDeuda({ monto_total: 1 });
    await updateAdminDeuda(1, { monto_total: 2 });
    await deleteAdminDeuda(1);
    await createAdminDeudaPago(1, { monto: 1 });
    await deleteAdminDeudaPago(1, 2);
  });

  it('convierte el fallo de login y propaga errores operativos', async () => {
    authService.login.mockRejectedValueOnce(new Error('Credenciales'));
    await expect(loginAdmin('a@b.com', 'bad')).resolves.toEqual({ success: false, error: 'Credenciales' });

    productoService.obtenerProductosAdmin.mockRejectedValueOnce(new Error('backend caído'));
    await expect(fetchAdminProductos()).rejects.toThrow('backend caído');
  });
});
