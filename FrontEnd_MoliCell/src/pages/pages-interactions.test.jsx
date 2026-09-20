import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactPage from './ContactPage/ContactPage';
import ProductPage from './ProductPage/ProductPage';
import TechnicalServicePage from './TechnicalServicePage/TechnicalServicePage';
import { tecnicoService } from '../services';

vi.mock('../services', () => ({
  productoService: { obtenerProductoPorId: vi.fn() },
  tecnicoService: { consultarSeguimiento: vi.fn() },
}));

const product = {
  id: 1,
  name: 'Equipo',
  precio: 1000,
  stock: 2,
  imagenes: ['https://cdn.example/a.webp'],
  categorias: [{ id: 1, name: 'Celulares' }],
  especificaciones: { RAM: '8GB' },
};

describe('interacciones de páginas públicas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });

  it('codifica de forma segura el formulario de contacto para WhatsApp', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ContactPage />);
    fireEvent.change(screen.getByPlaceholderText('María'), { target: { value: 'Ana & Co' } });
    fireEvent.change(screen.getByPlaceholderText('González'), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByPlaceholderText(/consulta por reparación/i), { target: { value: 'Pantalla' } });
    fireEvent.change(screen.getByPlaceholderText(/Contanos tu consulta/i), { target: { value: '¿Hay stock?' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensaje/i }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('Ana%20%26%20Co'), '_blank', 'noopener,noreferrer');
  });

  it('consulta seguimiento y envía un presupuesto por WhatsApp', async () => {
    tecnicoService.consultarSeguimiento.mockResolvedValueOnce({
      codigo_seguimiento: 'MC-ABC123',
      dispositivo: 'Moto G',
      falla_descripcion: 'Pantalla',
      estado: 'Listo',
      creado_en: '2026-01-01T00:00:00.000Z',
    });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<TechnicalServicePage />);

    fireEvent.change(screen.getByPlaceholderText(/REP-1042/i), { target: { value: 'mc-abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }));
    await screen.findByText('MC-ABC123');

    fireEvent.change(screen.getByPlaceholderText(/Martín Gómez/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText(/iPhone 11/i), { target: { value: 'Moto G' } });
    fireEvent.change(screen.getByLabelText(/Tipo de problema/i), { target: { value: 'Cambio de Batería' } });
    fireEvent.change(screen.getByPlaceholderText(/Contanos qué le sucede/i), { target: { value: 'Dura poco' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar consulta/i }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('CONSULTA%20DE%20SERVICIO'), '_blank', 'noopener,noreferrer');
  });

  it('limita la cantidad al stock y agrega el producto al carrito', async () => {
    const add = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <MemoryRouter initialEntries={['/producto/1']}>
        <Routes><Route path="/producto/:id" element={<ProductPage productos={[product]} onAddToCart={add} />} /></Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Equipo' });
    fireEvent.click(screen.getByLabelText('Sumar cantidad'));
    fireEvent.click(screen.getByLabelText('Sumar cantidad'));
    fireEvent.click(screen.getByRole('button', { name: /Agregar al Carrito/i }));
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: 1, cantidad: 2 }));
    fireEvent.click(screen.getByRole('button', { name: /Consultar por WhatsApp/i }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank', 'noopener,noreferrer');
    await waitFor(() => expect(screen.getByText(/Agregado al carrito/i)).toBeInTheDocument());
  });
});
