import { beforeEach, describe, expect, it, vi } from 'vitest';
import { printThermalTicket, ticketToPlainText } from './printThermalTicket';

describe('impresión térmica', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('convierte cabecera, metadatos y tabla a texto de ancho acotado', () => {
    document.body.innerHTML = `
      <div id="ticket">
        <section class="ticket-header"><h4>Moli Cell</h4><span class="ticket-subtitle">Venta</span></section>
        <section class="ticket-divider"></section>
        <section class="ticket-meta"><div class="meta-row"><span>Cliente</span><span>Ana</span></div></section>
        <table><thead><tr><th>Cant</th><th>Producto</th><th>Total</th></tr></thead><tbody><tr><td>2</td><td>Cable USB</td><td>$200</td></tr></tbody></table>
      </div>`;
    const text = ticketToPlainText(document.getElementById('ticket'));
    expect(text).toContain('Moli Cell');
    expect(text).toContain('Cliente');
    expect(text).toContain('Cable USB');
  });

  it('envía health y print al agente local', async () => {
    document.body.innerHTML = '<div id="ticket"><section class="ticket-footer">Gracias</section></div>';
    const fetchMock = vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await expect(printThermalTicket('ticket')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].body).toContain('Gracias');
  });

  it('rechaza un elemento inexistente sin llamar al agente', async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const fetchMock = vi.spyOn(window, 'fetch');
    await expect(printThermalTicket('missing')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
