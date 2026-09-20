import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const { product } = vi.hoisted(() => ({ product: {
  id: 1,
  name: 'Equipo de prueba',
  descripcion: 'Descripción',
  precio: 1000,
  precio_costo: 500,
  stock: 5,
  activo: true,
  destacado: true,
  descuento: false,
  img_url: 'https://cdn.example/equipo.webp',
  imagenes: ['https://cdn.example/equipo.webp'],
  marca: 'Marca',
  categorias: [{ id: 1, name: 'Celulares' }],
  especificaciones: { RAM: '8 GB' },
} }));

vi.mock('../services', () => ({
  categoriaService: { obtenerCategorias: vi.fn().mockResolvedValue([{ id: 1, name: 'Celulares' }]) },
  productoService: {
    obtenerProductos: vi.fn().mockResolvedValue([product]),
    obtenerProductoPorId: vi.fn().mockResolvedValue(product),
  },
  tecnicoService: { consultarSeguimiento: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../services/productoService', () => ({
  productoService: { obtenerProductos: vi.fn().mockResolvedValue([product]) },
}));

vi.mock('../admin/services/adminApi', () => ({
  loginAdmin: vi.fn().mockResolvedValue({ success: true, usuario: { id: 1, email: 'admin@test.com', rol: 'admin' } }),
  fetchAdminResumen: vi.fn().mockResolvedValue({
    productos_activos: 1,
    productos_stock_bajo: 1,
    alertas_stock: [product],
    reparaciones_activas: 1,
    reparaciones_recientes: [{ id: 1, codigo_seguimiento: 'MC-ABC123', cliente_nombre: 'Ana', dispositivo: 'A', estado: 'Pendiente' }],
    ventas_totales: 1,
  }),
  fetchAdminProductos: vi.fn().mockResolvedValue([product]),
  fetchAdminCategorias: vi.fn().mockResolvedValue([{ id: 1, name: 'Celulares' }]),
  fetchAdminMarcas: vi.fn().mockResolvedValue([{ id: 1, name: 'Marca' }]),
  fetchAdminReparaciones: vi.fn().mockResolvedValue({ servicios: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 } }),
  fetchAdminVentas: vi.fn().mockResolvedValue({ data: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 15 } }),
  createAdminProducto: vi.fn(),
  updateAdminProducto: vi.fn(),
  deleteAdminProducto: vi.fn(),
  reactivarAdminProducto: vi.fn(),
  createAdminCategoria: vi.fn(),
  deleteAdminCategoria: vi.fn(),
  createAdminMarca: vi.fn(),
  deleteAdminMarca: vi.fn(),
  createAdminReparacion: vi.fn(),
  updateAdminReparacion: vi.fn(),
  deleteAdminReparacion: vi.fn(),
  createAdminVenta: vi.fn(),
}));

const renderRoute = (route, authenticated = false) => {
  if (authenticated) {
    sessionStorage.setItem('molicell_admin_user', JSON.stringify({ id: 1, email: 'admin@test.com', rol: 'admin' }));
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
};

describe('smoke test de todas las rutas', () => {
  beforeAll(() => {
    window.scrollTo = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  beforeEach(() => sessionStorage.clear());

  it.each([
    ['/', /Catálogo Completo/i],
    ['/catalogo', /Catálogo completo/i],
    ['/contacto', /Contactanos/i],
    ['/servicio-tecnico', /Servicio Técnico/i],
    ['/producto/1', /Equipo de prueba/i],
    ['/admin/login', /Moli-Cell Admin/i],
  ])('renderiza la ruta pública %s', async (route, expected) => {
    renderRoute(route);
    await waitFor(() => expect(screen.getAllByText(expected).length).toBeGreaterThan(0));
  });

  it.each([
    ['/admin', /Resumen General/i],
    ['/admin/productos', /Inventario de Productos/i],
    ['/admin/categorias-marcas', /Categorías & Marcas/i],
    ['/admin/reparaciones', /Órdenes de Servicio Técnico/i],
    ['/admin/ventas', /Ventas & Registro de Caja/i],
  ])('renderiza la ruta protegida %s con sesión válida', async (route, expected) => {
    renderRoute(route, true);
    await waitFor(() => expect(screen.getAllByText(expected).length).toBeGreaterThan(0));
  });
});
