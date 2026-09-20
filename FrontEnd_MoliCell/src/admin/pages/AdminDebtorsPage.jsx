import { useEffect, useMemo, useState } from 'react';
import { Banknote, Edit2, Eye, Plus, Trash2, Users, X } from 'lucide-react';
import {
  createAdminDeuda, createAdminDeudaPago, deleteAdminDeuda, deleteAdminDeudaPago,
  fetchAdminDeuda, fetchAdminDeudas, updateAdminDeuda,
} from '../services/adminApi';

const localDate = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const emptyDebt = () => ({ persona_nombre: '', telefono: '', concepto: '', origen: 'Venta', referencia: '', monto_total: '', fecha: localDate(), vencimiento: '', notas: '' });
const emptyPayment = () => ({ monto: '', fecha: localDate(), notas: '' });
const money = (value) => Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
const statusClass = (status) => status === 'Pagada' ? 'paid' : status === 'Parcial' ? 'partial' : 'pending';

export default function AdminDebtorsPage() {
  const [filters, setFilters] = useState({ estado: 'activas', origen: 'todos' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ deudas: [], resumen: {}, pagination: { currentPage: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debtModal, setDebtModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDebt);
  const [payment, setPayment] = useState(emptyPayment);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: '', error: false });
  const query = useMemo(() => ({ ...filters, search, page, limit: 20 }), [filters, search, page]);

  const load = async () => {
    const result = await fetchAdminDeudas(query);
    setData(result);
    return result;
  };

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try { const result = await fetchAdminDeudas(query); if (active) setData(result); }
      catch (err) { if (active) setError(err.message || 'No se pudieron cargar los deudores.'); }
      finally { if (active) setLoading(false); }
    }, query.search ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  const notify = (text, isError = false) => { setToast({ text, error: isError }); window.setTimeout(() => setToast({ text: '', error: false }), 3000); };
  const openCreate = () => { setEditing(null); setForm(emptyDebt()); setDebtModal(true); };
  const openEdit = (debt) => {
    setEditing(debt);
    setForm({ persona_nombre: debt.persona_nombre, telefono: debt.telefono || '', concepto: debt.concepto, origen: debt.origen, referencia: debt.referencia || '', monto_total: debt.monto_total, fecha: String(debt.fecha).slice(0, 10), vencimiento: debt.vencimiento ? String(debt.vencimiento).slice(0, 10) : '', notas: debt.notas || '' });
    setDebtModal(true);
  };
  const openDetail = async (debt) => {
    try { setDetail(await fetchAdminDeuda(debt.id)); }
    catch (err) { notify(err.message || 'No se pudo cargar el detalle.', true); }
  };
  const openPayment = (debt) => { setDetail(debt); setPayment(emptyPayment()); setPaymentModal(true); };

  const saveDebt = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, monto_total: Number(form.monto_total), vencimiento: form.vencimiento || null };
      if (editing) await updateAdminDeuda(editing.id, payload); else await createAdminDeuda(payload);
      setDebtModal(false); notify(editing ? 'Deuda actualizada.' : 'Deuda registrada.'); await load();
    } catch (err) { notify(err.message || 'No se pudo guardar la deuda.', true); }
    finally { setSaving(false); }
  };
  const savePayment = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await createAdminDeudaPago(detail.id, { ...payment, monto: Number(payment.monto) });
      setPaymentModal(false); notify('Pago registrado.'); await load(); setDetail(await fetchAdminDeuda(detail.id));
    } catch (err) { notify(err.message || 'No se pudo registrar el pago.', true); }
    finally { setSaving(false); }
  };
  const removeDebt = async (debt) => {
    if (!window.confirm(`¿Eliminar la deuda de ${debt.persona_nombre}?`)) return;
    try { await deleteAdminDeuda(debt.id); notify('Deuda eliminada.'); await load(); }
    catch (err) { notify(err.message || 'No se pudo eliminar.', true); }
  };
  const removePayment = async (paymentId) => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    try { await deleteAdminDeudaPago(detail.id, paymentId); setDetail(await fetchAdminDeuda(detail.id)); await load(); notify('Pago eliminado.'); }
    catch (err) { notify(err.message || 'No se pudo eliminar el pago.', true); }
  };

  const resumen = data.resumen || {};
  const pagination = data.pagination || {};
  return <div className="management-page debtors-page">
    {toast.text && <div role="status" className={`management-toast ${toast.error ? 'error' : ''}`}>{toast.text}</div>}
    <section className="management-header"><div><h2>Deudores</h2><p>Controlá quién debe, cuánto falta cobrar y cada pago recibido.</p></div><button className="primary-action" type="button" onClick={openCreate}><Plus size={18} /> Nueva deuda</button></section>
    <section className="summary-grid" aria-label="Resumen de deudas"><div className="summary-card"><div className="summary-label">Saldo pendiente</div><div className="summary-value">{money(resumen.total_pendiente)}</div><div className="summary-hint">Dinero todavía no cobrado</div></div><div className="summary-card"><div className="summary-label">Total cobrado</div><div className="summary-value">{money(resumen.total_cobrado)}</div><div className="summary-hint">Pagos acumulados del filtro</div></div><div className="summary-card"><div className="summary-label">Registros</div><div className="summary-value">{resumen.cantidad || 0}</div><div className="summary-hint">Personas y conceptos</div></div></section>
    <section className="management-toolbar"><div className="filter-grid"><label>Estado<select value={filters.estado} onChange={(e) => { setFilters((v) => ({ ...v, estado: e.target.value })); setPage(1); }}><option value="activas">Con saldo</option><option value="todas">Todas</option><option>Pendiente</option><option>Parcial</option><option>Pagada</option></select></label><label>Origen<select value={filters.origen} onChange={(e) => { setFilters((v) => ({ ...v, origen: e.target.value })); setPage(1); }}><option value="todos">Todos</option><option>Venta</option><option>Servicio</option><option>Otro</option></select></label><label>Buscar<input type="search" placeholder="Persona, teléfono, concepto..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label></div></section>
    {error && <div role="alert" className="management-alert">{error}</div>}
    <section className="management-card">{loading ? <div className="empty-management">Cargando deudores…</div> : data.deudas?.length ? <div className="responsive-table"><table><thead><tr><th>Persona</th><th>Concepto</th><th>Origen</th><th>Total</th><th>Cobrado</th><th>Saldo</th><th>Estado</th><th /></tr></thead><tbody>{data.deudas.map((debt) => <tr key={debt.id}><td><strong>{debt.persona_nombre}</strong><div className="summary-hint">{debt.telefono || 'Sin teléfono'}</div></td><td>{debt.concepto}<div className="summary-hint">{String(debt.fecha).slice(0,10)}{debt.referencia ? ` · ${debt.referencia}` : ''}</div></td><td><span className="category-pill">{debt.origen}</span></td><td className="amount">{money(debt.monto_total)}</td><td>{money(debt.monto_pagado)}</td><td className="amount">{money(debt.saldo_pendiente)}</td><td><span className={`status-pill ${statusClass(debt.estado)}`}>{debt.estado}</span></td><td><div className="row-actions"><button type="button" className="icon-action" aria-label={`Ver ${debt.persona_nombre}`} onClick={() => openDetail(debt)}><Eye size={16} /></button><button type="button" className="primary-action" aria-label={`Cobrar ${debt.persona_nombre}`} disabled={!debt.saldo_pendiente} onClick={() => openPayment(debt)}><Banknote size={16} /></button><button type="button" className="icon-action" aria-label={`Editar ${debt.persona_nombre}`} onClick={() => openEdit(debt)}><Edit2 size={16} /></button><button type="button" className="danger-action" aria-label={`Eliminar ${debt.persona_nombre}`} onClick={() => removeDebt(debt)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <div className="empty-management"><Users size={34} /><p>No hay deudas para este filtro.</p></div>}
      <div className="pagination"><button className="secondary-action" type="button" disabled={(pagination.currentPage || 1) <= 1} onClick={() => setPage((v) => v - 1)}>Anterior</button><span>Página {pagination.currentPage || 1} de {pagination.totalPages || 1}</span><button className="secondary-action" type="button" disabled={(pagination.currentPage || 1) >= (pagination.totalPages || 1)} onClick={() => setPage((v) => v + 1)}>Siguiente</button></div></section>

    {debtModal && <div className="management-modal-overlay" onClick={() => setDebtModal(false)}><div className="management-modal" onClick={(e) => e.stopPropagation()}><div className="management-modal-header"><h3>{editing ? 'Editar deuda' : 'Registrar deuda'}</h3><button className="icon-action" type="button" aria-label="Cerrar" onClick={() => setDebtModal(false)}><X size={18} /></button></div><form className="management-form" onSubmit={saveDebt}><div className="form-grid"><label>Persona *<input required minLength={2} value={form.persona_nombre} onChange={(e) => setForm((v) => ({ ...v, persona_nombre: e.target.value }))} /></label><label>Teléfono<input value={form.telefono} onChange={(e) => setForm((v) => ({ ...v, telefono: e.target.value }))} /></label></div><label>Concepto *<input required minLength={2} value={form.concepto} onChange={(e) => setForm((v) => ({ ...v, concepto: e.target.value }))} /></label><div className="form-grid"><label>Origen *<select value={form.origen} onChange={(e) => setForm((v) => ({ ...v, origen: e.target.value }))}><option>Venta</option><option>Servicio</option><option>Otro</option></select></label><label>Referencia<input placeholder="N.º de venta u orden" value={form.referencia} onChange={(e) => setForm((v) => ({ ...v, referencia: e.target.value }))} /></label></div><div className="form-grid"><label>Monto total *<input required type="number" min="0.01" step="0.01" value={form.monto_total} onChange={(e) => setForm((v) => ({ ...v, monto_total: e.target.value }))} /></label><label>Fecha *<input required type="date" value={form.fecha} onChange={(e) => setForm((v) => ({ ...v, fecha: e.target.value }))} /></label></div><label>Vencimiento<input type="date" value={form.vencimiento} onChange={(e) => setForm((v) => ({ ...v, vencimiento: e.target.value }))} /></label><label>Notas<textarea rows={3} value={form.notas} onChange={(e) => setForm((v) => ({ ...v, notas: e.target.value }))} /></label><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setDebtModal(false)}>Cancelar</button><button type="submit" className="primary-action" disabled={saving}>{saving ? 'Guardando…' : 'Guardar deuda'}</button></div></form></div></div>}

    {paymentModal && detail && <div className="management-modal-overlay" onClick={() => setPaymentModal(false)}><div className="management-modal" onClick={(e) => e.stopPropagation()}><div className="management-modal-header"><h3>Registrar pago de {detail.persona_nombre}</h3><button className="icon-action" type="button" aria-label="Cerrar" onClick={() => setPaymentModal(false)}><X size={18} /></button></div><form className="management-form" onSubmit={savePayment}><div className="management-alert" style={{ background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>Saldo disponible: <strong>{money(detail.saldo_pendiente)}</strong></div><div className="form-grid"><label>Monto *<input required type="number" min="0.01" max={detail.saldo_pendiente} step="0.01" value={payment.monto} onChange={(e) => setPayment((v) => ({ ...v, monto: e.target.value }))} /></label><label>Fecha *<input required type="date" value={payment.fecha} onChange={(e) => setPayment((v) => ({ ...v, fecha: e.target.value }))} /></label></div><label>Notas<input maxLength={500} value={payment.notas} onChange={(e) => setPayment((v) => ({ ...v, notas: e.target.value }))} /></label><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setPaymentModal(false)}>Cancelar</button><button type="submit" className="primary-action" disabled={saving}>Confirmar pago</button></div></form></div></div>}

    {detail && !paymentModal && <div className="management-modal-overlay" onClick={() => setDetail(null)}><div className="management-modal" onClick={(e) => e.stopPropagation()}><div className="management-modal-header"><div><h3>{detail.persona_nombre}</h3><div className="summary-hint">{detail.concepto}</div></div><button className="icon-action" type="button" aria-label="Cerrar detalle" onClick={() => setDetail(null)}><X size={18} /></button></div><section className="summary-grid" style={{ padding: 20 }}><div className="summary-card"><div className="summary-label">Total</div><div className="summary-value">{money(detail.monto_total)}</div></div><div className="summary-card"><div className="summary-label">Cobrado</div><div className="summary-value">{money(detail.monto_pagado)}</div></div><div className="summary-card"><div className="summary-label">Pendiente</div><div className="summary-value">{money(detail.saldo_pendiente)}</div></div></section><div className="payment-history"><strong>Historial de pagos</strong>{detail.pagos?.length ? detail.pagos.map((item) => <div className="payment-row" key={item.id}><span>{String(item.fecha).slice(0,10)}</span><span>{item.notas || 'Pago'}</span><strong>{money(item.monto)}</strong><button type="button" className="danger-action" aria-label={`Eliminar pago ${item.id}`} onClick={() => removePayment(item.id)}><Trash2 size={15} /></button></div>) : <div className="empty-management">Todavía no se registraron pagos.</div>}<button type="button" className="primary-action" disabled={!detail.saldo_pendiente} onClick={() => openPayment(detail)}><Banknote size={16} /> Registrar pago</button></div></div></div>}
  </div>;
}
