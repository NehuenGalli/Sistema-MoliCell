import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, WalletCards, X } from 'lucide-react';
import { createAdminGasto, deleteAdminGasto, fetchAdminGastos, updateAdminGasto } from '../services/adminApi';

const CATEGORIES = ['Factura', 'Proveedor', 'Alquiler', 'Servicios', 'Impuestos', 'Sueldos', 'General', 'Otro'];
const localDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const emptyForm = () => ({ categoria: 'General', descripcion: '', monto: '', fecha: localDate(), proveedor: '', comprobante: '', notas: '' });
const money = (value) => Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export default function AdminExpensesPage() {
  const [filters, setFilters] = useState({ periodo: 'mes', fecha: localDate(), mes: localDate().slice(0, 7), desde: localDate(), hasta: localDate(), categoria: 'todas' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ gastos: [], resumen: {}, pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ text: '', error: false });

  const query = useMemo(() => {
    const params = { periodo: filters.periodo, categoria: filters.categoria, search, page, limit: 20 };
    if (filters.periodo === 'mes') params.mes = filters.mes;
    if (filters.periodo === 'dia' || filters.periodo === 'semana') params.fecha = filters.fecha;
    if (filters.periodo === 'personalizado') Object.assign(params, { desde: filters.desde, hasta: filters.hasta });
    return params;
  }, [filters, search, page]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAdminGastos(query);
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err.message || 'No se pudieron cargar los gastos.');
      } finally {
        if (active) setLoading(false);
      }
    }, query.search ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  const notify = (text, isError = false) => {
    setToast({ text, error: isError });
    window.setTimeout(() => setToast({ text: '', error: false }), 3000);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (gasto) => {
    setEditing(gasto);
    setForm({
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: String(gasto.fecha).slice(0, 10),
      proveedor: gasto.proveedor || '',
      comprobante: gasto.comprobante || '',
      notas: gasto.notas || '',
    });
    setModalOpen(true);
  };

  const reload = async () => setData(await fetchAdminGastos(query));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, monto: Number(form.monto) };
      if (editing) await updateAdminGasto(editing.id, payload);
      else await createAdminGasto(payload);
      setModalOpen(false);
      notify(editing ? 'Gasto actualizado.' : 'Gasto registrado.');
      await reload();
    } catch (err) {
      notify(err.message || 'No se pudo guardar el gasto.', true);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (gasto) => {
    if (!window.confirm(`¿Eliminar el gasto "${gasto.descripcion}"?`)) return;
    try {
      await deleteAdminGasto(gasto.id);
      notify('Gasto eliminado.');
      await reload();
    } catch (err) {
      notify(err.message || 'No se pudo eliminar el gasto.', true);
    }
  };

  const setPeriod = (periodo) => { setFilters((current) => ({ ...current, periodo })); setPage(1); };
  const resumen = data.resumen || {};
  const pagination = data.pagination || { currentPage: 1, totalPages: 1 };

  return (
    <div className="management-page expenses-page">
      {toast.text && <div role="status" className={`management-toast ${toast.error ? 'error' : ''}`}>{toast.text}</div>}
      <section className="management-header">
        <div><h2>Gastos</h2><p>Registrá egresos y consultá en qué se usa el dinero del negocio.</p></div>
        <button type="button" className="primary-action" onClick={openCreate}><Plus size={18} /> Nuevo gasto</button>
      </section>

      <section className="summary-grid" aria-label="Resumen de gastos">
        <div className="summary-card"><div className="summary-label">Total del período</div><div className="summary-value">{money(resumen.total_monto)}</div><div className="summary-hint">Del {resumen.desde || '—'} al {resumen.hasta || '—'}</div></div>
        <div className="summary-card"><div className="summary-label">Movimientos</div><div className="summary-value">{resumen.cantidad || 0}</div><div className="summary-hint">Gastos registrados</div></div>
        <div className="summary-card"><div className="summary-label">Promedio</div><div className="summary-value">{money(resumen.promedio)}</div><div className="summary-hint">Por movimiento</div></div>
      </section>

      <section className="management-toolbar">
        <div className="period-buttons" aria-label="Período">
          {[['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día'], ['personalizado', 'Personalizado']].map(([value, label]) => (
            <button key={value} type="button" className={`period-button ${filters.periodo === value ? 'active' : ''}`} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <div className="filter-grid">
          {filters.periodo === 'mes' && <label>Mes<input aria-label="Mes" type="month" value={filters.mes} onChange={(e) => { setFilters((current) => ({ ...current, mes: e.target.value })); setPage(1); }} /></label>}
          {(filters.periodo === 'dia' || filters.periodo === 'semana') && <label>{filters.periodo === 'dia' ? 'Fecha' : 'Día dentro de la semana'}<input aria-label="Fecha del período" type="date" value={filters.fecha} onChange={(e) => { setFilters((current) => ({ ...current, fecha: e.target.value })); setPage(1); }} /></label>}
          {filters.periodo === 'personalizado' && <><label>Desde<input type="date" value={filters.desde} onChange={(e) => setFilters((current) => ({ ...current, desde: e.target.value }))} /></label><label>Hasta<input type="date" value={filters.hasta} onChange={(e) => setFilters((current) => ({ ...current, hasta: e.target.value }))} /></label></>}
          <label>Categoría<select value={filters.categoria} onChange={(e) => { setFilters((current) => ({ ...current, categoria: e.target.value })); setPage(1); }}><option value="todas">Todas</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Buscar<input type="search" placeholder="Descripción, proveedor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
        </div>
      </section>

      {error && <div role="alert" className="management-alert">{error}</div>}
      <section className="management-card">
        {loading ? <div className="empty-management">Cargando gastos…</div> : data.gastos?.length ? (
          <div className="responsive-table"><table><thead><tr><th>Fecha</th><th>Detalle</th><th>Categoría</th><th>Proveedor / comprobante</th><th>Monto</th><th aria-label="Acciones" /></tr></thead><tbody>
            {data.gastos.map((gasto) => <tr key={gasto.id}><td>{String(gasto.fecha).slice(0, 10)}</td><td><strong>{gasto.descripcion}</strong>{gasto.notas && <div className="summary-hint">{gasto.notas}</div>}</td><td><span className="category-pill">{gasto.categoria}</span></td><td>{gasto.proveedor || '—'}{gasto.comprobante && <div className="summary-hint">Comp. {gasto.comprobante}</div>}</td><td className="amount">{money(gasto.monto)}</td><td><div className="row-actions"><button type="button" className="icon-action" aria-label={`Editar ${gasto.descripcion}`} onClick={() => openEdit(gasto)}><Edit2 size={16} /></button><button type="button" className="danger-action" aria-label={`Eliminar ${gasto.descripcion}`} onClick={() => remove(gasto)}><Trash2 size={16} /></button></div></td></tr>)}
          </tbody></table></div>
        ) : <div className="empty-management"><WalletCards size={34} /><p>No hay gastos en este período.</p></div>}
        <div className="pagination"><button className="secondary-action" type="button" disabled={pagination.currentPage <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {pagination.currentPage || 1} de {pagination.totalPages || 1}</span><button className="secondary-action" type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>
      </section>

      {modalOpen && <div className="management-modal-overlay" onClick={() => setModalOpen(false)}><div className="management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="management-modal-header"><h3>{editing ? 'Editar gasto' : 'Registrar gasto'}</h3><button type="button" className="icon-action" aria-label="Cerrar" onClick={() => setModalOpen(false)}><X size={18} /></button></div>
        <form className="management-form" onSubmit={save}>
          <div className="form-grid"><label>Descripción *<input required minLength={2} maxLength={200} value={form.descripcion} onChange={(e) => setForm((current) => ({ ...current, descripcion: e.target.value }))} /></label><label>Monto *<input required type="number" min="0.01" step="0.01" value={form.monto} onChange={(e) => setForm((current) => ({ ...current, monto: e.target.value }))} /></label></div>
          <div className="form-grid"><label>Categoría *<select required value={form.categoria} onChange={(e) => setForm((current) => ({ ...current, categoria: e.target.value }))}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label>Fecha *<input required type="date" value={form.fecha} onChange={(e) => setForm((current) => ({ ...current, fecha: e.target.value }))} /></label></div>
          <div className="form-grid"><label>Proveedor<input maxLength={120} value={form.proveedor} onChange={(e) => setForm((current) => ({ ...current, proveedor: e.target.value }))} /></label><label>Comprobante<input maxLength={80} value={form.comprobante} onChange={(e) => setForm((current) => ({ ...current, comprobante: e.target.value }))} /></label></div>
          <label>Notas<textarea rows={3} maxLength={2000} value={form.notas} onChange={(e) => setForm((current) => ({ ...current, notas: e.target.value }))} /></label>
          <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" className="primary-action" disabled={saving}>{saving ? 'Guardando…' : 'Guardar gasto'}</button></div>
        </form>
      </div></div>}
    </div>
  );
}
