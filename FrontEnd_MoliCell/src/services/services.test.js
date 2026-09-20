import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it } from 'vitest';
import apiClient, { invalidateGetCache } from './apiClient';
import { authService } from './authService';
import { categoriaService } from './categoriaService';
import { dashboardService } from './dashboardService';
import { marcaService } from './marcaService';
import { prepararPayloadProducto, productoService } from './productoService';
import { tecnicoService } from './tecnicoService';
import { ventaService } from './ventaService';

describe('servicios HTTP', () => {
  let mock;

  beforeEach(() => {
    invalidateGetCache();
    mock = new MockAdapter(apiClient);
    mock.onAny().reply((config) => [200, {
      data: config.url === '/auth/login'
        ? { usuario: { id: 1, email: 'admin@test.com' }, csrfToken: 'csrf' }
        : { ok: true },
      method: config.method,
      url: config.url,
    }]);
  });

  it('gestiona la sesión sin guardar el JWT en almacenamiento web', async () => {
    const login = await authService.login('admin@test.com', 'password123');
    expect(login.usuario.email).toBe('admin@test.com');
    expect(sessionStorage.getItem('molicell_csrf_token')).toBe('csrf');
    expect(authService.estaAutenticado()).toBe(true);
    expect(authService.obtenerUsuarioActual()).toEqual(login.usuario);

    mock.onPost('/auth/logout').reply(204);
    await authService.logout();
    expect(authService.estaAutenticado()).toBe(false);
  });

  it('conserva el estado local si el servidor no confirma el logout', async () => {
    sessionStorage.setItem('molicell_admin_user', JSON.stringify({ id: 1, email: 'admin@test.com' }));
    sessionStorage.setItem('molicell_csrf_token', 'csrf');
    mock.resetHandlers();
    mock.onPost('/auth/logout').reply(503, { error: 'No disponible' });

    await expect(authService.logout()).rejects.toThrow('No disponible');
    expect(authService.estaAutenticado()).toBe(true);
    expect(sessionStorage.getItem('molicell_csrf_token')).toBe('csrf');
  });

  it('cubre CRUD de categorías y marcas con invalidación de cache', async () => {
    await categoriaService.obtenerCategorias();
    await categoriaService.obtenerCategoriaPorId(1);
    await categoriaService.crearCategoria('Accesorios');
    await categoriaService.actualizarCategoria(1, 'Fundas');
    await categoriaService.eliminarCategoria(1);
    await marcaService.obtenerMarcas();
    await marcaService.obtenerMarcaPorId(1);
    await marcaService.crearMarca('Marca');
    await marcaService.actualizarMarca(1, 'Marca 2');
    await marcaService.eliminarMarca(1);

    expect(mock.history.get).toHaveLength(4);
    expect(mock.history.post).toHaveLength(2);
    expect(mock.history.put).toHaveLength(2);
    expect(mock.history.delete).toHaveLength(2);
  });

  it('serializa productos y cubre sus endpoints', async () => {
    const file = new File(['image'], 'foto.png', { type: 'image/png' });
    const payload = prepararPayloadProducto({
      name: 'Equipo',
      imagenes: [file, 'https://cdn.test/foto.webp'],
      especificaciones: { RAM: '8GB' },
      omitido: null,
    });
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('name')).toBe('Equipo');
    expect(payload.getAll('imagenes')).toHaveLength(2);

    await productoService.obtenerProductos({ limit: 8 });
    await productoService.obtenerProductosAdmin(true);
    await productoService.obtenerProductoPorId(1);
    await productoService.obtenerProductosPorCategoria(2);
    await productoService.obtenerProductosPorMarca(3);
    await productoService.crearProducto({ name: 'Equipo' });
    await productoService.actualizarProducto(1, new FormData());
    await productoService.reactivarProducto(1);
    await productoService.eliminarProducto(1);

    expect(mock.history.get).toHaveLength(5);
    expect(mock.history.patch).toHaveLength(2);
  });

  it('cubre servicio técnico, ventas y resumen', async () => {
    await tecnicoService.consultarSeguimiento('MC-ABC 123');
    await tecnicoService.obtenerServiciosTecnicos({ page: 1 });
    await tecnicoService.crearServicioTecnico({ dispositivo: 'A' });
    await tecnicoService.actualizarServicioTecnico(1, { estado: 'Listo' });
    await tecnicoService.eliminarServicioTecnico(1);
    await ventaService.obtenerVentas({ page: 1 });
    await ventaService.crearVenta({ productos: [] });
    await dashboardService.obtenerResumen();

    expect(mock.history.get.some((request) => request.url.includes('MC-ABC%20123'))).toBe(true);
    expect(mock.history.get.some((request) => request.url === '/dashboard/resumen')).toBe(true);
  });
});
