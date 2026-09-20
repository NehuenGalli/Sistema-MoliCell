import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDebtorsPage from './AdminDebtorsPage';
import { createAdminDeuda, createAdminDeudaPago, deleteAdminDeuda, fetchAdminDeuda, fetchAdminDeudas, updateAdminDeuda } from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  createAdminDeuda: vi.fn(), createAdminDeudaPago: vi.fn(), deleteAdminDeuda: vi.fn(), deleteAdminDeudaPago: vi.fn(),
  fetchAdminDeuda: vi.fn(), fetchAdminDeudas: vi.fn(), updateAdminDeuda: vi.fn(),
}));

const debt = { id: 1, persona_nombre: 'Ana Pérez', telefono: '1111', concepto: 'Venta', origen: 'Venta', referencia: 'VEN-1', monto_total: 100000, monto_pagado: 20000, saldo_pendiente: 80000, fecha: '2026-09-10', vencimiento: null, estado: 'Parcial', notas: '' };
const response = { deudas: [debt], resumen: { cantidad: 1, total_original: 100000, total_cobrado: 20000, total_pendiente: 80000 }, pagination: { currentPage: 1, totalPages: 1, totalItems: 1 } };

describe('AdminDebtorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetchAdminDeudas.mockResolvedValue(response);
    fetchAdminDeuda.mockResolvedValue({ ...debt, pagos: [{ id: 2, deuda_id: 1, monto: 20000, fecha: '2026-09-15', notas: 'Cuota' }] });
    createAdminDeuda.mockResolvedValue({ id: 2 });
    updateAdminDeuda.mockResolvedValue(debt);
    createAdminDeudaPago.mockResolvedValue({ id: 3 });
    deleteAdminDeuda.mockResolvedValue(debt);
  });

  it('muestra saldos y detalle de pagos', async () => {
    render(<AdminDebtorsPage />);
    await screen.findByText('Ana Pérez');
    fireEvent.click(screen.getByRole('button', { name: 'Ver Ana Pérez' }));
    expect(await screen.findByText('Historial de pagos')).toBeInTheDocument();
    expect(screen.getByText('Cuota')).toBeInTheDocument();
  });

  it('crea, edita, cobra y elimina una deuda', async () => {
    render(<AdminDebtorsPage />);
    await screen.findByText('Ana Pérez');
    fireEvent.click(screen.getByRole('button', { name: /Nueva deuda/i }));
    fireEvent.change(screen.getByLabelText(/^Persona/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/^Concepto/i), { target: { value: 'Reparación' } });
    fireEvent.change(screen.getByLabelText(/^Monto total/i), { target: { value: '50000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar deuda/i }));
    await waitFor(() => expect(createAdminDeuda).toHaveBeenCalledWith(expect.objectContaining({ persona_nombre: 'Juan', monto_total: 50000 })));

    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana Pérez' }));
    fireEvent.change(screen.getByLabelText(/^Teléfono/i), { target: { value: '2222' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar deuda/i }));
    await waitFor(() => expect(updateAdminDeuda).toHaveBeenCalledWith(1, expect.objectContaining({ telefono: '2222' })));

    fireEvent.click(screen.getByRole('button', { name: 'Cobrar Ana Pérez' }));
    fireEvent.change(screen.getByLabelText(/^Monto/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));
    await waitFor(() => expect(createAdminDeudaPago).toHaveBeenCalledWith(1, expect.objectContaining({ monto: 10000 })));

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Ana Pérez' }));
    await waitFor(() => expect(deleteAdminDeuda).toHaveBeenCalledWith(1));
  });
});
