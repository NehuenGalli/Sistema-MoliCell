import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCategoriesBrandsPage from './AdminCategoriesBrandsPage';
import AdminProductsPage from './AdminProductsPage';
import AdminRepairsPage from './AdminRepairsPage';
import AdminSalesPage from './AdminSalesPage';
import {
  createAdminCategoria,
  createAdminMarca,
  createAdminProducto,
  createAdminReparacion,
  createAdminVenta,
  deleteAdminCategoria,
  deleteAdminMarca,
  deleteAdminProducto,
  deleteAdminReparacion,
  fetchAdminCategorias,
  fetchAdminMarcas,
  fetchAdminProductos,
  fetchAdminReparaciones,
  fetchAdminVentas,
  updateAdminProducto,
  updateAdminReparacion,
} from '../services/adminApi';
import { productoService } from '../../services/productoService';

vi.mock('../services/adminApi', () => ({
  fetchAdminCategorias: vi.fn(),
  createAdminCategoria: vi.fn(),
  deleteAdminCategoria: vi.fn(),
  fetchAdminMarcas: vi.fn(),
  createAdminMarca: vi.fn(),
  deleteAdminMarca: vi.fn(),
  fetchAdminProductos: vi.fn(),
  createAdminProducto: vi.fn(),
  updateAdminProducto: vi.fn(),
  deleteAdminProducto: vi.fn(),
  reactivarAdminProducto: vi.fn(),
  fetchAdminReparaciones: vi.fn(),
  createAdminReparacion: vi.fn(),
  updateAdminReparacion: vi.fn(),
  deleteAdminReparacion: vi.fn(),
  fetchAdminVentas: vi.fn(),
  createAdminVenta: vi.fn(),
}));

vi.mock('../../services/productoService', () => ({
  productoService: { obtenerProductos: vi.fn() },
}));

vi.mock('../utils/printThermalTicket', () => ({ printThermalTicket: vi.fn() }));

const categoria = { id: 1, name: 'Celulares' };
const marca = { id: 1, name: 'Samsung' };
const producto = {
  id: 1,
  name: 'Galaxy A55',
  precio: 500000,
  precio_costo: 350000,
  stock: 4,
  activo: true,
  marca_id: 1,
  marca: 'Samsung',
  categorias: [categoria],
  descripcion: 'Equipo nuevo',
};
const reparacion = {
  id: 1,
  codigo_seguimiento: 'MC-1042',
  cliente_nombre: 'Ana Pérez',
  cliente_telefono: '1123456789',
  dispositivo: 'Moto G',
  falla_descripcion: 'Pantalla',
  presupuesto_estimado: 35000,
  estado: 'En Proceso',
  creado_en: '2026-01-01T00:00:00.000Z',
};
const venta = {
  id: 1,
  codigo_venta: 'VEN-1001',
  monto: 425000,
  subtotal: 500000,
  descuento_porcentaje: 15,
  descuento_monto: 75000,
  costo_total: 350000,
  metodo_pago: 'Efectivo',
  creado_en: '2026-01-02T00:00:00.000Z',
  productos: [{ ...producto, producto_id: 1, cantidad: 1 }],
};

describe('flujos administrativos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetchAdminCategorias.mockResolvedValue([categoria]);
    fetchAdminMarcas.mockResolvedValue([marca]);
    fetchAdminProductos.mockResolvedValue([producto]);
    fetchAdminReparaciones.mockResolvedValue({ servicios: [reparacion] });
    fetchAdminVentas.mockResolvedValue({
      data: [venta],
      pagination: { totalItems: 1, totalPages: 1, currentPage: 1, limit: 15 },
    });
    productoService.obtenerProductos.mockResolvedValue([producto]);
    createAdminCategoria.mockResolvedValue({ id: 2, name: 'Accesorios' });
    createAdminMarca.mockResolvedValue({ id: 2, name: 'Motorola' });
    createAdminProducto.mockResolvedValue({ id: 2 });
    updateAdminProducto.mockResolvedValue({ id: 1 });
    deleteAdminProducto.mockResolvedValue(true);
    createAdminReparacion.mockResolvedValue({ id: 2 });
    updateAdminReparacion.mockResolvedValue({ id: 1 });
    deleteAdminReparacion.mockResolvedValue(true);
    createAdminVenta.mockResolvedValue({ ...venta, id: 2, codigo_venta: 'VEN-1002' });
    deleteAdminCategoria.mockResolvedValue(true);
    deleteAdminMarca.mockResolvedValue(true);
  });

  it('crea y elimina categorías y marcas, incluyendo validación vacía', async () => {
    render(<AdminCategoriesBrandsPage />);
    await screen.findByText('Celulares');

    fireEvent.click(screen.getByRole('button', { name: /Agregar Categoría/i }));
    expect(screen.getByText('El campo es obligatorio')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Smartwatches/i), { target: { value: 'Accesorios' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar Categoría/i }));
    await waitFor(() => expect(createAdminCategoria).toHaveBeenCalledWith('Accesorios'));

    const categoryRow = screen.getByText('Celulares').closest('tr');
    fireEvent.click(within(categoryRow).getByRole('button'));
    await waitFor(() => expect(deleteAdminCategoria).toHaveBeenCalledWith(1));

    fireEvent.click(screen.getByRole('button', { name: /Marcas \(1\)/i }));
    fireEvent.change(screen.getByPlaceholderText(/Xiaomi/i), { target: { value: 'Motorola' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar Marca/i }));
    await waitFor(() => expect(createAdminMarca).toHaveBeenCalledWith('Motorola'));

    const brandRow = screen.getByText('Samsung').closest('tr');
    fireEvent.click(within(brandRow).getByRole('button'));
    await waitFor(() => expect(deleteAdminMarca).toHaveBeenCalledWith(1));
  });

  it('edita, filtra y da de baja un producto', async () => {
    render(<AdminProductsPage />);
    await screen.findByText('Galaxy A55');

    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.click(screen.getByLabelText('Solo con Descuento'));
    fireEvent.click(screen.getByLabelText('Solo con Descuento'));
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));

    fireEvent.click(screen.getByTitle('Editar producto'));
    await screen.findByRole('heading', { name: 'Editar Producto' });
    fireEvent.change(screen.getByPlaceholderText(/iPhone 14/i), { target: { value: 'Galaxy A55 5G' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    await waitFor(() => expect(updateAdminProducto).toHaveBeenCalledWith(1, expect.any(FormData)));

    await screen.findByText('Galaxy A55');
    fireEvent.click(screen.getByTitle('Dar de baja producto'));
    await waitFor(() => expect(deleteAdminProducto).toHaveBeenCalledWith(1));
  });

  it('valida, crea, edita y elimina órdenes de reparación', async () => {
    render(<AdminRepairsPage />);
    await screen.findByText('MC-1042');

    fireEvent.click(screen.getByRole('button', { name: /Nueva Orden de Reparación/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear Orden' }));
    expect(screen.getAllByText('El campo es obligatorio')).toHaveLength(4);
    fireEvent.change(screen.getByPlaceholderText(/Martín Gómez/i), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByPlaceholderText(/11 23456789/i), { target: { value: '1112345678' } });
    fireEvent.change(screen.getByPlaceholderText(/iPhone 13/i), { target: { value: 'Moto G' } });
    fireEvent.change(screen.getByPlaceholderText(/Cambio de Módulo/i), { target: { value: 'Batería' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Orden' }));
    await waitFor(() => expect(createAdminReparacion).toHaveBeenCalledWith(expect.objectContaining({
      cliente_nombre: 'Carlos',
      dispositivo: 'Moto G',
    })));
    expect(createAdminReparacion.mock.calls[0][0]).not.toHaveProperty('codigo_seguimiento');

    await screen.findByText('MC-1042');
    fireEvent.click(screen.getByTitle('Editar orden'));
    fireEvent.change(screen.getByPlaceholderText(/Martín Gómez/i), { target: { value: 'Ana Editada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    await waitFor(() => expect(updateAdminReparacion).toHaveBeenCalledWith(1, expect.objectContaining({ cliente_nombre: 'Ana Editada' })));
    expect(updateAdminReparacion.mock.calls[0][1]).not.toHaveProperty('codigo_seguimiento');

    fireEvent.click(screen.getByTitle('Eliminar'));
    await waitFor(() => expect(deleteAdminReparacion).toHaveBeenCalledWith(1));
  });

  it('consulta ventas, aplica filtros y registra una venta con stock disponible', async () => {
    render(<AdminSalesPage />);
    await screen.findByText('VEN-1001');

    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.change(screen.getByPlaceholderText('Mínimo'), { target: { value: '1000' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Transferencia' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar Filtros/i }));
    await waitFor(() => expect(fetchAdminVentas).toHaveBeenCalledWith(expect.objectContaining({
      min_monto: '1000',
      metodo_pago: 'Transferencia',
    })));

    fireEvent.click(screen.getByRole('button', { name: /Nueva Venta/i }));
    expect(screen.getByText(/15 % de descuento/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Registrar Venta/i }));
    expect(screen.getByText(/Debés agregar al menos un producto/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar' }));
    fireEvent.click(screen.getByRole('button', { name: /Registrar Venta/i }));
    await waitFor(() => expect(createAdminVenta).toHaveBeenCalledWith(expect.objectContaining({
      monto: 425000,
      metodo_pago: 'Efectivo',
      productos: [{ producto_id: 1, cantidad: 1 }],
    })));
    expect(await screen.findByText(/Descuento efectivo \(15%\)/i)).toBeInTheDocument();
  });
});
