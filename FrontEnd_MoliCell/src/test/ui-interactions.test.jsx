import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from '../admin/pages/AdminDashboardPage';
import AdminLoginPage from '../admin/pages/AdminLoginPage';
import Footer from '../components/Footer/Footer';
import Navbar from '../components/navbar/Navbar';
import Offers from '../components/Offers/Offers';
import CatalogPage from '../pages/CatalogPage/CatalogPage';
import { fetchAdminResumen } from '../admin/services/adminApi';
import { useAdminAuth } from '../admin/context/useAdminAuth';

vi.mock('../admin/services/adminApi', () => ({ fetchAdminResumen: vi.fn() }));
vi.mock('../admin/context/useAdminAuth', () => ({ useAdminAuth: vi.fn() }));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
};

const renderWithRouter = (ui, route = '/') => render(
  <MemoryRouter initialEntries={[route]}>
    {ui}
    <LocationProbe />
  </MemoryRouter>,
);

describe('interacciones de navegación y panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    useAdminAuth.mockReturnValue({ login: vi.fn(), loading: false });
  });

  it('navega desde búsqueda, categorías y menú móvil, y abre el carrito', () => {
    const onOpenCart = vi.fn();
    renderWithRouter(<Navbar cartCount={2} categorias={[{ id: 1, name: 'Celulares & Más' }]} onOpenCart={onOpenCart} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    const search = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(search, { target: { value: ' iphone pro ' } });
    fireEvent.submit(search.closest('form'));
    expect(screen.getByTestId('location')).toHaveTextContent('/catalogo?buscar=iphone%20pro');

    fireEvent.click(screen.getByRole('button', { name: /Categorías/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Celulares & Más' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/catalogo?categoria=Celulares%20%26%20M%C3%A1s');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getAllByRole('button', { name: /CATEGORÍAS/i }).at(-1));
    fireEvent.click(screen.getAllByRole('button', { name: 'Celulares & Más' }).at(-1));
    expect(document.body.style.overflow).toBe('unset');

    fireEvent.click(screen.getAllByRole('button', { name: /Carrito/i })[0]);
    expect(onOpenCart).toHaveBeenCalledTimes(1);
  });

  it('ejecuta accesos seguros y desplazamiento interno desde el pie', () => {
    const section = document.createElement('div');
    section.id = 'ofertas';
    section.getBoundingClientRect = () => ({ top: 200 });
    document.body.appendChild(section);
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderWithRouter(<Footer categorias={[{ id: 1, name: 'Impresiones 3D' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('Hola%20Moli-Cell'), '_blank', 'noopener,noreferrer');
    expect(screen.getByRole('link', { name: 'Impresiones 3D' })).toHaveAttribute('href', '/catalogo?categoria=Impresiones%203D');
    fireEvent.click(screen.getByRole('link', { name: 'Ofertas y Descuentos' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 115, behavior: 'smooth' });
    section.remove();
  });

  it('renderiza métricas y recupera el dashboard después de un error', async () => {
    fetchAdminResumen
      .mockRejectedValueOnce(new Error('Servicio temporalmente no disponible'))
      .mockResolvedValueOnce({
        productos_activos: 8,
        productos_stock_bajo: 1,
        alertas_stock: [{ id: 1, name: 'Cable USB', stock: 0, categorias: [{ name: 'Accesorios' }] }],
        reparaciones_activas: 2,
        reparaciones_recientes: [{ id: 1, codigo_seguimiento: 'MC-55', cliente_nombre: 'Ana', dispositivo: 'Moto G', estado: 'Listo' }],
        ventas_totales: 12,
      });
    renderWithRouter(<AdminDashboardPage />, '/admin');
    expect(await screen.findByText('Servicio temporalmente no disponible')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    await screen.findByText('MC-55');
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
    expect(fetchAdminResumen).toHaveBeenCalledTimes(2);
  });

  it('valida el login, alterna la contraseña e informa credenciales rechazadas', async () => {
    const login = vi.fn().mockResolvedValue({ success: false, error: 'Credenciales inválidas' });
    useAdminAuth.mockReturnValue({ login, loading: false });
    renderWithRouter(<AdminLoginPage />, '/admin/login');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    expect(screen.getAllByText('El campo es obligatorio')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(login).toHaveBeenCalledWith('admin@test.com', 'password123');
  });

  it('redirige al panel después de un login válido', async () => {
    const login = vi.fn().mockResolvedValue({ success: true });
    useAdminAuth.mockReturnValue({ login, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<h1>Panel autenticado</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Panel autenticado' })).toBeInTheDocument());
  });

  it('muestra sólo ofertas y controla el desplazamiento del carrusel', () => {
    const products = Array.from({ length: 4 }, (_, index) => ({
      id: index + 1,
      name: `Oferta ${index + 1}`,
      precio: 1000,
      descuento: true,
      descuento_precio: 800,
    }));
    const { container, rerender } = renderWithRouter(<Offers productos={products} />);
    const track = container.querySelector('.offers-track');
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, value: 0, writable: true },
    });
    track.scrollBy = vi.fn();
    fireEvent(window, new Event('resize'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver siguientes ofertas' }));
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });

    rerender(
      <MemoryRouter>
        <Offers productos={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No hay productos en oferta actualmente/i)).toBeInTheDocument();
  });

  it('combina búsqueda, categoría, marca, precio, oferta y orden del catálogo', async () => {
    const products = [
      {
        id: 1, name: 'Alpha Phone', descripcion: 'Premium', precio: 10000,
        descuento: true, descuento_precio: 8000, destacado: true,
        marca: 'Samsung', categorias: [{ name: 'Celulares' }],
      },
      {
        id: 2, name: 'Beta Cable', descripcion: 'USB', precio: 20000,
        descuento: false, marca: 'Motorola', categoria: 'Accesorios',
      },
      {
        id: 3, nombre: 'Gamma Genérico', precio: 1600000,
      },
    ];
    renderWithRouter(<CatalogPage productos={products} />, '/catalogo?buscar=Alpha&ofertas=true');
    await waitFor(() => expect(screen.getByText(/Mostrando/)).toHaveTextContent('1 de 3'));
    expect(screen.getByText('Alpha Phone')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }));
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('2 de 3');
    fireEvent.click(screen.getByLabelText('Celulares (1)'));
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('1 de 3');
    fireEvent.click(screen.getByLabelText('Samsung (1)'));
    expect(screen.getByText('Alpha Phone')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price-desc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Precio' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '15000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('1 de 3');
    fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    const search = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(search, { target: { value: 'inexistente' } });
    expect(screen.getByRole('heading', { name: 'No encontramos productos' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Limpiar filtros/i }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByRole('heading', { name: 'Filtros' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ver \(2\) resultados/i }));
    expect(screen.queryByRole('heading', { name: 'Filtros' })).not.toBeInTheDocument();
  });
});
