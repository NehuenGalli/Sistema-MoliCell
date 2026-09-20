import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator, HandCoins, Receipt, ShoppingBag, Wrench } from 'lucide-react';
import { fetchAdminGanancias } from '../services/adminApi';

const localDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const money = (value) => Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
const shortDate = (value) => {
  if (!value) return '—';
  if (!String(value).includes('T')) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(value));
};

const DetailSection = ({ title, icon: Icon, children, empty, count = 0 }) => (
  <section className="management-card profit-detail-card">
    <div className="profit-section-title">
      <div><Icon size={18} /><h3>{title}</h3></div>
      <span>{count} movimiento{count === 1 ? '' : 's'}</span>
    </div>
    {count ? children : <div className="empty-management"><p>{empty}</p></div>}
  </section>
);

export default function AdminProfitsPage() {
  const today = localDate();
  const [filters, setFilters] = useState({ periodo: 'mes', fecha: today, mes: today.slice(0, 7), desde: today, hasta: today });
  const [data, setData] = useState({ resumen: {}, detalle: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = { periodo: filters.periodo };
    if (filters.periodo === 'mes') params.mes = filters.mes;
    if (filters.periodo === 'dia' || filters.periodo === 'semana') params.fecha = filters.fecha;
    if (filters.periodo === 'personalizado') Object.assign(params, { desde: filters.desde, hasta: filters.hasta });
    return params;
  }, [filters]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAdminGanancias(query);
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err.message || 'No se pudo calcular la ganancia.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [query]);

  const setPeriod = (periodo) => setFilters((current) => ({ ...current, periodo }));
  const resumen = data.resumen || {};
  const detalle = data.detalle || {};
  const netPositive = Number(resumen.ganancia_neta || 0) >= 0;

  return (
    <div className="management-page profits-page">
      <section className="management-header">
        <div><h2>Ganancias</h2><p>Resultado neto y detalle de cada movimiento del negocio.</p></div>
        <div className="profit-range">Del {resumen.desde || '—'} al {resumen.hasta || '—'}</div>
      </section>

      <section className="management-toolbar">
        <div className="period-buttons" aria-label="Período">
          {[["mes", "Mes"], ["semana", "Semana"], ["dia", "Día"], ["personalizado", "Personalizado"]].map(([value, label]) => (
            <button key={value} type="button" className={`period-button ${filters.periodo === value ? 'active' : ''}`} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <div className="filter-grid profit-filters">
          {filters.periodo === 'mes' && <label>Mes<input aria-label="Mes" type="month" value={filters.mes} onChange={(event) => setFilters((current) => ({ ...current, mes: event.target.value }))} /></label>}
          {(filters.periodo === 'dia' || filters.periodo === 'semana') && <label>{filters.periodo === 'dia' ? 'Fecha' : 'Día dentro de la semana'}<input aria-label="Fecha del período" type="date" value={filters.fecha} onChange={(event) => setFilters((current) => ({ ...current, fecha: event.target.value }))} /></label>}
          {filters.periodo === 'personalizado' && <><label>Desde<input aria-label="Desde" type="date" value={filters.desde} onChange={(event) => setFilters((current) => ({ ...current, desde: event.target.value }))} /></label><label>Hasta<input aria-label="Hasta" type="date" value={filters.hasta} onChange={(event) => setFilters((current) => ({ ...current, hasta: event.target.value }))} /></label></>}
        </div>
      </section>

      {error && <div role="alert" className="management-alert">{error}</div>}
      {loading ? <div className="management-card empty-management" role="status">Calculando ganancias…</div> : <>
        <section className={`profit-hero ${netPositive ? 'positive' : 'negative'}`} aria-label="Ganancia neta">
          <div><span>Ganancia neta del período</span><strong>{money(resumen.ganancia_neta)}</strong><small>Ingresos menos costos, gastos y dinero por cobrar</small></div>
          <Calculator size={38} aria-hidden="true" />
        </section>

        <section className="summary-grid profit-summary" aria-label="Resumen financiero">
          <div className="summary-card"><div className="summary-icon income"><ArrowUpRight size={18} /></div><div className="summary-label">Ingresos totales</div><div className="summary-value">{money(resumen.ingresos_totales)}</div><div className="summary-hint">Ventas, servicios habilitados y cobros</div></div>
          <div className="summary-card"><div className="summary-icon outcome"><ArrowDownRight size={18} /></div><div className="summary-label">Egresos y pendientes</div><div className="summary-value">{money(resumen.egresos_totales)}</div><div className="summary-hint">Costos, gastos y deuda generada</div></div>
          <div className="summary-card"><div className="summary-label">Dinero por cobrar generado</div><div className="summary-value">{money(resumen.deudas_generadas)}</div><div className="summary-hint">Se descuenta hasta que se registre el cobro</div></div>
        </section>

        <section className="profit-breakdown" aria-label="Composición de la ganancia">
          <div><span>Ventas cobradas</span><strong>{money(resumen.ingresos_ventas)}</strong></div>
          <div><span>Servicios listos o entregados</span><strong>{money(resumen.ingresos_servicios)}</strong></div>
          <div><span>Cobros de deudas</span><strong>{money(resumen.cobros_deudas)}</strong></div>
          <div className="subtract"><span>Costo de productos</span><strong>− {money(resumen.costo_productos)}</strong></div>
          <div className="subtract"><span>Gastos</span><strong>− {money(resumen.gastos)}</strong></div>
          <div className="subtract"><span>Nuevas deudas</span><strong>− {money(resumen.deudas_generadas)}</strong></div>
        </section>

        <DetailSection title="Ventas" icon={ShoppingBag} count={detalle.ventas?.length || 0} empty="No hubo ventas en el período.">
          <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Venta</th><th>Pago</th><th>Subtotal</th><th>Descuento</th><th>Ingreso</th><th>Costo</th></tr></thead><tbody>{(detalle.ventas || []).map((venta) => <tr key={venta.id}><td>{shortDate(venta.fecha)}</td><td><strong>{venta.codigo_venta || `#${venta.id}`}</strong></td><td>{venta.metodo_pago}</td><td>{money(venta.subtotal)}</td><td>{money(venta.descuento_monto)}</td><td className="amount positive-amount">{money(venta.monto)}</td><td className="amount negative-amount">{money(venta.costo_productos)}</td></tr>)}</tbody></table></div>
        </DetailSection>

        <DetailSection title="Servicios reconocidos" icon={Wrench} count={detalle.servicios?.length || 0} empty="No hay servicios listos o entregados en el período.">
          <div className="responsive-table"><table><thead><tr><th>Fecha reconocida</th><th>Seguimiento</th><th>Cliente</th><th>Dispositivo</th><th>Estado</th><th>Ingreso</th></tr></thead><tbody>{(detalle.servicios || []).map((servicio) => <tr key={servicio.id}><td>{shortDate(servicio.fecha_reconocimiento)}</td><td><strong>{servicio.codigo_seguimiento}</strong></td><td>{servicio.cliente_nombre || '—'}</td><td>{servicio.dispositivo}</td><td>{servicio.estado}</td><td className="amount positive-amount">{money(servicio.presupuesto_estimado)}</td></tr>)}</tbody></table></div>
        </DetailSection>

        <DetailSection title="Gastos" icon={Receipt} count={detalle.gastos?.length || 0} empty="No hubo gastos en el período.">
          <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Detalle</th><th>Categoría</th><th>Proveedor</th><th>Monto</th></tr></thead><tbody>{(detalle.gastos || []).map((gasto) => <tr key={gasto.id}><td>{shortDate(gasto.fecha)}</td><td><strong>{gasto.descripcion}</strong></td><td>{gasto.categoria}</td><td>{gasto.proveedor || '—'}</td><td className="amount negative-amount">{money(gasto.monto)}</td></tr>)}</tbody></table></div>
        </DetailSection>

        <DetailSection title="Deudas generadas" icon={HandCoins} count={detalle.deudas?.length || 0} empty="No se generaron deudas en el período.">
          <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Persona</th><th>Concepto</th><th>Origen</th><th>Total</th><th>Cobrado histórico</th></tr></thead><tbody>{(detalle.deudas || []).map((deuda) => <tr key={deuda.id}><td>{shortDate(deuda.fecha)}</td><td><strong>{deuda.persona_nombre}</strong></td><td>{deuda.concepto}</td><td>{deuda.origen}</td><td className="amount negative-amount">{money(deuda.monto_total)}</td><td>{money(deuda.monto_pagado)}</td></tr>)}</tbody></table></div>
        </DetailSection>

        <DetailSection title="Cobros de deudas" icon={ArrowUpRight} count={detalle.cobros?.length || 0} empty="No hubo cobros de deudas en el período.">
          <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Persona</th><th>Concepto</th><th>Nota</th><th>Cobrado</th></tr></thead><tbody>{(detalle.cobros || []).map((cobro) => <tr key={cobro.id}><td>{shortDate(cobro.fecha)}</td><td><strong>{cobro.persona_nombre}</strong></td><td>{cobro.concepto}</td><td>{cobro.notas || '—'}</td><td className="amount positive-amount">{money(cobro.monto)}</td></tr>)}</tbody></table></div>
        </DetailSection>
      </>}
    </div>
  );
}
