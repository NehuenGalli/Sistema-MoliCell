import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminExpensesPage from './AdminExpensesPage';
import { createAdminGasto, deleteAdminGasto, fetchAdminGastos, updateAdminGasto } from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  createAdminGasto: vi.fn(), deleteAdminGasto: vi.fn(), fetchAdminGastos: vi.fn(), updateAdminGasto: vi.fn(),
}));

const result = {
  gastos: [{ id: 1, categoria: 'Proveedor', descripcion: 'Repuestos', monto: 10000, fecha: '2026-09-20', proveedor: 'ACME', comprobante: 'A1', notas: '' }],
  resumen: { total_monto: 10000, cantidad: 1, promedio: 10000, desde: '2026-09-01', hasta: '2026-09-30' },
  pagination: { totalItems: 1, totalPages: 1, currentPage: 1, limit: 20 },
};

describe('AdminExpensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fetchAdminGastos.mockResolvedValue(result);
    createAdminGasto.mockResolvedValue({ id: 2 });
    updateAdminGasto.mockResolvedValue({ id: 1 });
    deleteAdminGasto.mockResolvedValue({ id: 1 });
  });

  it('muestra el resumen y permite filtrar períodos', async () => {
    render(<AdminExpensesPage />);
    expect(await screen.findByText('Repuestos')).toBeInTheDocument();
    expect(screen.getAllByText('$ 10.000,00')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    await waitFor(() => expect(fetchAdminGastos).toHaveBeenLastCalledWith(expect.objectContaining({ periodo: 'semana' })));
  });

  it('crea, edita y elimina gastos', async () => {
    render(<AdminExpensesPage />);
    await screen.findByText('Repuestos');
    fireEvent.click(screen.getByRole('button', { name: /Nuevo gasto/i }));
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Internet' } });
    fireEvent.change(screen.getByLabelText(/^Monto/i), { target: { value: '25000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar gasto/i }));
    await waitFor(() => expect(createAdminGasto).toHaveBeenCalledWith(expect.objectContaining({ descripcion: 'Internet', monto: 25000 })));

    fireEvent.click(screen.getByRole('button', { name: 'Editar Repuestos' }));
    fireEvent.change(screen.getByLabelText(/^Monto/i), { target: { value: '12000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar gasto/i }));
    await waitFor(() => expect(updateAdminGasto).toHaveBeenCalledWith(1, expect.objectContaining({ monto: 12000 })));

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Repuestos' }));
    await waitFor(() => expect(deleteAdminGasto).toHaveBeenCalledWith(1));
  });
});
