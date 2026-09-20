import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminProfitsPage from './AdminProfitsPage';
import { fetchAdminGanancias } from '../services/adminApi';

vi.mock('../services/adminApi', () => ({ fetchAdminGanancias: vi.fn() }));

const report = {
  resumen: {
    desde: '2032-04-01', hasta: '2032-04-30', ingresos_ventas: 850,
    ingresos_servicios: 2000, cobros_deudas: 100, ingresos_totales: 2950,
    costo_productos: 400, gastos: 100, deudas_generadas: 300,
    egresos_totales: 800, ganancia_neta: 2150,
  },
  detalle: {
    ventas: [{ id: 1, fecha: '2032-04-15', codigo_venta: 'V-1', metodo_pago: 'Efectivo', subtotal: 1000, descuento_monto: 150, monto: 850, costo_productos: 400 }],
    servicios: [{ id: 2, fecha_reconocimiento: '2032-04-15T10:00:00Z', codigo_seguimiento: 'MC-TEST01', cliente_nombre: 'Ana', dispositivo: 'iPhone', estado: 'Listo', presupuesto_estimado: 2000 }],
    gastos: [{ id: 3, fecha: '2032-04-15', descripcion: 'Insumo', categoria: 'Proveedor', proveedor: 'ACME', monto: 100 }],
    deudas: [{ id: 4, fecha: '2032-04-15', persona_nombre: 'Juan', concepto: 'Saldo', origen: 'Venta', monto_total: 300, monto_pagado: 100 }],
    cobros: [{ id: 5, fecha: '2032-04-15', persona_nombre: 'Juan', concepto: 'Saldo', notas: 'Cuota', monto: 100 }],
  },
};

describe('AdminProfitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminGanancias.mockResolvedValue(report);
  });

  it('muestra el resultado y el detalle completo', async () => {
    render(<AdminProfitsPage />);
    expect(await screen.findByText('V-1')).toBeInTheDocument();
    expect(screen.getByText('MC-TEST01')).toBeInTheDocument();
    expect(screen.getByText('Insumo')).toBeInTheDocument();
    expect(screen.getAllByText('Juan')).toHaveLength(2);
    expect(screen.getByText('$ 2.150,00')).toBeInTheDocument();
    expect(screen.getByText('$ 2.950,00')).toBeInTheDocument();
    expect(screen.getByText('$ 800,00')).toBeInTheDocument();
  });

  it('consulta semana, día y rango personalizado', async () => {
    render(<AdminProfitsPage />);
    await screen.findByText('V-1');

    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    await waitFor(() => expect(fetchAdminGanancias).toHaveBeenLastCalledWith(expect.objectContaining({ periodo: 'semana' })));

    fireEvent.click(screen.getByRole('button', { name: 'Día' }));
    await waitFor(() => expect(fetchAdminGanancias).toHaveBeenLastCalledWith(expect.objectContaining({ periodo: 'dia' })));

    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2032-04-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2032-04-30' } });
    await waitFor(() => expect(fetchAdminGanancias).toHaveBeenLastCalledWith({ periodo: 'personalizado', desde: '2032-04-01', hasta: '2032-04-30' }));
  });

  it('informa errores de carga', async () => {
    fetchAdminGanancias.mockRejectedValueOnce(new Error('Reporte no disponible'));
    render(<AdminProfitsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Reporte no disponible');
  });
});
