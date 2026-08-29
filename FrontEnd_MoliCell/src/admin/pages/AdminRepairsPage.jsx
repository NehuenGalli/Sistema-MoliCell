import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Clock, 
  CheckCircle2, 
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Smartphone,
  User,
  Phone,
  DollarSign,
  Calendar,
  Wrench,
  AlertCircle,
  MessageSquare,
  Printer
} from 'lucide-react';
import { 
  fetchAdminReparaciones, 
  createAdminReparacion, 
  updateAdminReparacion, 
  deleteAdminReparacion 
} from '../services/adminApi';
import './AdminRepairsPage.css';

export default function AdminRepairsPage() {
  const [reparaciones, setReparaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);

  // Modal Ver Más para Celulares y Desktop
  const [selectedRepairDetail, setSelectedRepairDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal Ticket de Impresión
  const [selectedRepairForTicket, setSelectedRepairForTicket] = useState(null);

  // Drawer de Filtros Avanzados (Siguiendo la idea de ventas)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({
    estado: 'todos',
    ordenFecha: 'recientes'
  });

  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });
  const [errorLoad, setErrorLoad] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleTriggerPrint = () => {
    window.print();
  };

  const [form, setForm] = useState({
    codigo: '',
    cliente: '',
    telefono: '',
    dispositivo: '',
    falla: '',
    estado: 'En Proceso',
    costoEstimado: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorLoad('');
    try {
      const res = await fetchAdminReparaciones();
      // El backend devuelve { servicios, pagination } o arreglo plano
      const data = Array.isArray(res)
        ? res
        : (res?.servicios || res?.data || []);
      setReparaciones(data);
    } catch (err) {
      setErrorLoad(err.message || 'Error al obtener órdenes de servicio técnico del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 3500);
  };

  const handleResetFilters = () => {
    setFilterParams({
      estado: 'todos',
      ordenFecha: 'recientes'
    });
    setSearchTerm('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterParams.estado !== 'todos') count++;
    if (filterParams.ordenFecha !== 'recientes') count++;
    return count;
  }, [filterParams]);

  // Filtrado y ordenamiento en cliente
  const filteredRepairs = useMemo(() => {
    let list = [...reparaciones];

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(r => {
        const codigo = (r.codigo_seguimiento || r.codigo || '').toLowerCase();
        const cliente = (r.cliente_nombre || r.cliente || '').toLowerCase();
        const telefono = (r.cliente_telefono || r.telefono || '').toLowerCase();
        const disp = (r.dispositivo || '').toLowerCase();
        const falla = (r.falla_descripcion || r.falla || '').toLowerCase();
        return codigo.includes(term) || cliente.includes(term) || telefono.includes(term) || disp.includes(term) || falla.includes(term);
      });
    }

    if (filterParams.estado !== 'todos') {
      list = list.filter(r => (r.estado || '').toLowerCase() === filterParams.estado.toLowerCase());
    }

    list.sort((a, b) => {
      const dateA = new Date(a.creado_en || a.fecha || 0).getTime();
      const dateB = new Date(b.creado_en || b.fecha || 0).getTime();
      return filterParams.ordenFecha === 'antiguos' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [reparaciones, searchTerm, filterParams]);

  const handleOpenCreateModal = () => {
    setEditingRepair(null);
    setFormErrors({});
    const autoCode = `MC-${Math.floor(1000 + Math.random() * 9000)}`;
    setForm({
      codigo: autoCode,
      cliente: '',
      telefono: '',
      dispositivo: '',
      falla: '',
      estado: 'En Proceso',
      costoEstimado: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (repair) => {
    setEditingRepair(repair);
    setFormErrors({});
    setForm({
      codigo: repair.codigo_seguimiento || repair.codigo || '',
      cliente: repair.cliente_nombre || repair.cliente || '',
      telefono: repair.cliente_telefono || repair.telefono || '',
      dispositivo: repair.dispositivo || '',
      falla: repair.falla_descripcion || repair.falla || '',
      estado: repair.estado || 'En Proceso',
      costoEstimado: repair.presupuesto_estimado !== undefined && repair.presupuesto_estimado !== null ? repair.presupuesto_estimado : ''
    });
    setIsModalOpen(true);
  };

  const handleSaveRepair = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!form.cliente.trim()) errors.cliente = 'El campo es obligatorio';
    if (!form.telefono.trim()) errors.telefono = 'El campo es obligatorio';
    if (!form.dispositivo.trim()) errors.dispositivo = 'El campo es obligatorio';
    if (!form.falla.trim()) errors.falla = 'El campo es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload = {
      codigo_seguimiento: form.codigo.trim() || `MC-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente_nombre: form.cliente.trim(),
      cliente_telefono: form.telefono.trim(),
      dispositivo: form.dispositivo.trim(),
      falla_descripcion: form.falla.trim(),
      presupuesto_estimado: form.costoEstimado ? parseFloat(form.costoEstimado) : 0,
      estado: form.estado
    };

    try {
      if (editingRepair) {
        await updateAdminReparacion(editingRepair.id || editingRepair.codigo_seguimiento, payload);
        showToast('¡Orden de reparación actualizada!', 'success');
      } else {
        await createAdminReparacion(payload);
        showToast('¡Nueva orden de reparación creada!', 'success');
      }

      setIsModalOpen(false);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error al guardar la orden de reparación', 'error');
    }
  };

  const handleDeleteRepair = async (id, codigo) => {
    if (window.confirm(`¿Confirmás eliminar la orden de reparación "${codigo}"?`)) {
      try {
        await deleteAdminReparacion(id);
        showToast('Orden eliminada', 'success');
        loadData();
      } catch (err) {
        showToast(err.message || 'Error al eliminar la orden de reparación', 'error');
      }
    }
  };

  const getStepIndex = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e.includes('pendiente')) return 1;
    if (e.includes('proceso')) return 2;
    if (e.includes('listo')) return 3;
    if (e.includes('entregado')) return 4;
    return 1;
  };

  return (
    <div className="admin-repairs-page">
      
      {toastMsg.text && (
        <div 
          className="admin-toast animate-fade-in"
          style={{ 
            backgroundColor: toastMsg.type === 'error' ? '#EF4444' : '#10B981',
            boxShadow: toastMsg.type === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.3)'
          }}
        >
          {toastMsg.type === 'error' ? <X size={18} /> : <Check size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {errorLoad && (
        <div className="admin-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '12px' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Error al obtener órdenes de servicio técnico</strong>
            <span style={{ fontSize: '0.85rem' }}>{errorLoad}</span>
          </div>
          <button 
            type="button" 
            onClick={() => loadData()} 
            style={{ background: '#991B1B', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="page-header-actions">
        <div>
          <h2>Órdenes de Servicio Técnico</h2>
          <p>Gestioná los celulares ingresados a laboratorio y los códigos de seguimiento para clientes.</p>
        </div>

        <button type="button" onClick={handleOpenCreateModal} className="btn-add-main">
          <Plus size={18} />
          <span>Nueva Orden de Reparación</span>
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="products-table-controls">
        <button
          type="button"
          className={`admin-filter-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
          onClick={() => setIsFilterMenuOpen(true)}
        >
          <SlidersHorizontal size={17} />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </button>

        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ej: MC-1042), cliente, modelo o servicio..."
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="clear-btn">
              <X size={16} />
            </button>
          )}
        </div>

        <span className="results-badge">{filteredRepairs.length} órdenes</span>
      </div>

      {/* Panel Drawer Lateral de Filtros (Estilo Ventas) */}
      {isFilterMenuOpen && (
        <div className="filter-drawer-overlay" onClick={() => setIsFilterMenuOpen(false)}>
          <div className="filter-drawer-panel left-side" onClick={(e) => e.stopPropagation()}>
            
            <div className="filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} style={{ color: '#0F172A' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Filtros de Servicio Técnico</h4>
              </div>
              <button type="button" onClick={() => setIsFilterMenuOpen(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <div className="filter-drawer-body">
              {/* 1. Filtrar por Estado */}
              <div className="filter-field-group">
                <label>Estado de la Orden</label>
                <select
                  value={filterParams.estado}
                  onChange={(e) => setFilterParams(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="Pendiente">Pendiente de Revisión</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Listo">Listo para Retirar</option>
                  <option value="Entregado">Entregado al Cliente</option>
                </select>
              </div>

              {/* 2. Ordenar por Fecha */}
              <div className="filter-field-group">
                <label>Ordenar por Fecha</label>
                <select
                  value={filterParams.ordenFecha}
                  onChange={(e) => setFilterParams(prev => ({ ...prev, ordenFecha: e.target.value }))}
                >
                  <option value="recientes">Más Recientes Primero</option>
                  <option value="antiguos">Más Antiguos Primero</option>
                </select>
              </div>
            </div>

            <div className="filter-drawer-footer">
              <button type="button" onClick={handleResetFilters} className="btn-reset-filters">
                <RotateCcw size={14} /> Limpiar Todo
              </button>
              <button type="button" onClick={() => setIsFilterMenuOpen(false)} className="btn-apply-filters">
                Aplicar Filtros
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tabla de Órdenes */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-state">Cargando órdenes de reparación...</div>
        ) : (
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Código</th>
                <th className="col-mobile-hide">Cliente</th>
                <th>Dispositivo</th>
                <th className="col-mobile-hide">Servicio</th>
                <th className="col-mobile-hide">Presupuesto</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                    No se encontraron órdenes de servicio técnico con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const id = r.id || r.codigo_seguimiento;
                  const codigo = r.codigo_seguimiento || r.codigo;
                  const cliente = r.cliente_nombre || r.cliente;
                  const telefono = r.cliente_telefono || r.telefono;
                  const falla = r.falla_descripcion || r.falla;
                  const badge = (r.estado === 'Listo' || r.estado === 'Entregado') ? 'success' : (r.estado === 'Pendiente' ? 'info' : 'warning');
                  const presupuesto = r.presupuesto_estimado ? `$${Number(r.presupuesto_estimado).toLocaleString('es-AR')}` : 'A confirmar';

                  return (
                    <tr key={id}>
                      <td>
                        <strong className="code-pill">{codigo}</strong>
                      </td>
                      <td className="col-mobile-hide">
                        <strong style={{ display: 'block', color: '#0F172A' }}>{cliente}</strong>
                        {telefono && (
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{telefono}</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.88rem' }}>{r.dispositivo}</strong>
                      </td>
                      <td className="col-mobile-hide">
                        <span className="falla-subtext">{falla}</span>
                      </td>
                      <td className="col-mobile-hide">
                        <strong style={{ color: '#0F172A' }}>{presupuesto}</strong>
                      </td>
                      <td>
                        <span className={`table-badge status-${badge}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        
                        {/* Botón Ver Más solo en Mobile */}
                        <div className="mobile-actions-only">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepairDetail(r);
                              setIsDetailModalOpen(true);
                            }}
                            className="btn-ver-mas"
                          >
                            Ver más
                          </button>
                        </div>

                        {/* Acciones Desktop (Ver Detalle, Imprimir Ticket, Editar, Eliminar) */}
                        <div className="actions-flex desktop-actions-only">
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedRepairDetail(r);
                              setIsDetailModalOpen(true);
                            }} 
                            className="btn-action edit"
                            title="Ver Detalle"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setSelectedRepairForTicket(r)} 
                            className="btn-action ticket"
                            title="Imprimir Ticket de Servicio Técnico"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleOpenEditModal(r)} 
                            className="btn-action edit"
                            title="Editar orden"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteRepair(r.id, codigo)} 
                            className="btn-action delete"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL VER MÁS (MODERNIZADO) ── */}
      {isDetailModalOpen && selectedRepairDetail && (() => {
        const currentStep = getStepIndex(selectedRepairDetail.estado);
        const codigo = selectedRepairDetail.codigo_seguimiento || selectedRepairDetail.codigo;
        const cliente = selectedRepairDetail.cliente_nombre || selectedRepairDetail.cliente || 'No especificado';
        const telefono = selectedRepairDetail.cliente_telefono || selectedRepairDetail.telefono;
        const dispositivo = selectedRepairDetail.dispositivo;
        const falla = selectedRepairDetail.falla_descripcion || selectedRepairDetail.falla;
        const presupuesto = selectedRepairDetail.presupuesto_estimado
          ? `$${Number(selectedRepairDetail.presupuesto_estimado).toLocaleString('es-AR')}`
          : 'A confirmar';
        const fechaFormat = selectedRepairDetail.creado_en
          ? new Date(selectedRepairDetail.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : (selectedRepairDetail.fecha || '—');

        const badge = (selectedRepairDetail.estado === 'Listo' || selectedRepairDetail.estado === 'Entregado') ? 'success' : (selectedRepairDetail.estado === 'Pendiente' ? 'info' : 'warning');

        return (
          <div className="admin-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
            <div className="admin-modal-card detail-modal-card" onClick={(e) => e.stopPropagation()}>
              
              <div className="detail-modal-header">
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8', fontWeight: 700 }}>Órden de Servicio Técnico</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>#{codigo}</h3>
                    <span className={`table-badge status-${badge}`} style={{ fontSize: '0.78rem', padding: '3px 10px', margin: 0 }}>
                      {selectedRepairDetail.estado}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setIsDetailModalOpen(false)} className="close-modal-btn" style={{ color: '#FFFFFF' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="detail-modal-body">

                {/* Progress Timeline Stepper (Visible en Desktop) */}
                <div className="repair-timeline-container">
                  <div className="repair-timeline-title">Estado de Avance</div>
                  <div className="repair-timeline-stepper">
                    <div className="stepper-line">
                      <div 
                        className="stepper-line-progress" 
                        style={{ 
                          width: currentStep === 1 ? '0%' : currentStep === 2 ? '33%' : currentStep === 3 ? '66%' : '100%' 
                        }} 
                      />
                    </div>

                    <div className={`stepper-step ${currentStep > 1 ? 'completed' : (currentStep === 1 ? 'active' : '')}`}>
                      <div className="stepper-icon-circle">
                        {currentStep > 1 ? <Check size={15} /> : <Clock size={15} />}
                      </div>
                      <span className="stepper-label">Pendiente</span>
                    </div>

                    <div className={`stepper-step ${currentStep > 2 ? 'completed' : (currentStep === 2 ? 'active' : '')}`}>
                      <div className="stepper-icon-circle">
                        {currentStep > 2 ? <Check size={15} /> : <Wrench size={15} />}
                      </div>
                      <span className="stepper-label">En Proceso</span>
                    </div>

                    <div className={`stepper-step ${currentStep > 3 ? 'completed' : (currentStep === 3 ? 'active' : '')}`}>
                      <div className="stepper-icon-circle">
                        {currentStep > 3 ? <Check size={15} /> : <CheckCircle2 size={15} />}
                      </div>
                      <span className="stepper-label">Listo</span>
                    </div>

                    <div className={`stepper-step ${currentStep === 4 ? 'completed active' : ''}`}>
                      <div className="stepper-icon-circle">
                        <Check size={15} />
                      </div>
                      <span className="stepper-label">Entregado</span>
                    </div>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="detail-info-grid">
                  
                  <div className="detail-card-box full-width">
                    <span className="detail-card-label">
                      <Clock size={13} /> Estado Actual
                    </span>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`table-badge status-${badge}`} style={{ fontSize: '0.84rem', padding: '4px 12px' }}>
                        {selectedRepairDetail.estado}
                      </span>
                    </div>
                  </div>

                  <div className="detail-card-box">
                    <span className="detail-card-label">
                      <User size={13} /> Cliente
                    </span>
                    <span className="detail-card-value">{cliente}</span>
                    {telefono && (
                      <a
                        href={`https://wa.me/${telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-whatsapp-btn"
                      >
                        <MessageSquare size={13} /> {telefono}
                      </a>
                    )}
                  </div>

                  <div className="detail-card-box">
                    <span className="detail-card-label">
                      <Smartphone size={13} /> Dispositivo
                    </span>
                    <span className="detail-card-value">{dispositivo}</span>
                  </div>

                  <div className="detail-card-box full-width">
                    <span className="detail-card-label">
                      <Wrench size={13} /> Servicio
                    </span>
                    <span className="detail-card-value" style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>
                      {falla}
                    </span>
                  </div>

                  <div className="detail-card-box">
                    <span className="detail-card-label">
                      <DollarSign size={13} /> Presupuesto
                    </span>
                    <span className="detail-card-value" style={{ color: '#166534', fontSize: '1rem' }}>
                      {presupuesto}
                    </span>
                  </div>

                  <div className="detail-card-box">
                    <span className="detail-card-label">
                      <Calendar size={13} /> Fecha de Ingreso
                    </span>
                    <span className="detail-card-value" style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {fechaFormat}
                    </span>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="modal-footer" style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                  <button type="button" onClick={() => setIsDetailModalOpen(false)} className="btn-cancel" style={{ flex: '1', maxWidth: '100px' }}>
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRepairForTicket(selectedRepairDetail);
                    }}
                    className="btn-action-print"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', background: '#F1F5F9', color: '#0F172A', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, cursor: 'pointer', flex: '1', maxWidth: '150px' }}
                  >
                    <Printer size={16} />
                    <span>Imprimir Ticket</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedRepairDetail);
                    }} 
                    className="btn-save"
                    style={{ flex: '1', maxWidth: '150px' }}
                  >
                    Editar Orden
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ── MODAL CREAR / EDITAR REPARACIÓN ── */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3>{editingRepair ? `Editar Orden (${form.codigo})` : 'Nueva Orden de Reparación'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="modal-form" noValidate>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nombre del Cliente *</label>
                  <input
                    type="text"
                    className={formErrors.cliente ? 'input-has-error' : ''}
                    value={form.cliente}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, cliente: e.target.value }));
                      if (formErrors.cliente) setFormErrors(prev => ({ ...prev, cliente: '' }));
                    }}
                    placeholder="Ej: Martín Gómez"
                  />
                  {formErrors.cliente && (
                    <span className="field-error-text">{formErrors.cliente}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Teléfono del Cliente *</label>
                  <input
                    type="text"
                    className={formErrors.telefono ? 'input-has-error' : ''}
                    value={form.telefono}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, telefono: e.target.value }));
                      if (formErrors.telefono) setFormErrors(prev => ({ ...prev, telefono: '' }));
                    }}
                    placeholder="Ej: 11 23456789"
                  />
                  {formErrors.telefono && (
                    <span className="field-error-text">{formErrors.telefono}</span>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Dispositivo *</label>
                  <input
                    type="text"
                    className={formErrors.dispositivo ? 'input-has-error' : ''}
                    value={form.dispositivo}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, dispositivo: e.target.value }));
                      if (formErrors.dispositivo) setFormErrors(prev => ({ ...prev, dispositivo: '' }));
                    }}
                    placeholder="Ej: iPhone 13 - 128GB"
                  />
                  {formErrors.dispositivo && (
                    <span className="field-error-text">{formErrors.dispositivo}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Servicio *</label>
                  <input
                    type="text"
                    className={formErrors.falla ? 'input-has-error' : ''}
                    value={form.falla}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, falla: e.target.value }));
                      if (formErrors.falla) setFormErrors(prev => ({ ...prev, falla: '' }));
                    }}
                    placeholder="Ej: Cambio de Módulo de Pantalla"
                  />
                  {formErrors.falla && (
                    <span className="field-error-text">{formErrors.falla}</span>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Estado *</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="Pendiente">Pendiente de Revisión</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Listo">Listo para Retirar</option>
                    <option value="Entregado">Entregado al Cliente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Presupuesto Estimado ($ ARS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costoEstimado}
                    onChange={(e) => setForm(prev => ({ ...prev, costoEstimado: e.target.value }))}
                    placeholder="Ej: 35000"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px', width: '100%' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel" style={{ flex: '1', maxWidth: '140px' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" style={{ flex: '1', maxWidth: '170px' }}>
                  {editingRepair ? 'Guardar Cambios' : 'Crear Orden'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL IMPRESIÓN DE TICKET DE SERVICIO TÉCNICO ── */}
      {selectedRepairForTicket && (
        <div className="admin-modal-overlay ticket-repair-modal-overlay" onClick={() => setSelectedRepairForTicket(null)}>
          <div className="admin-modal-card ticket-repair-modal-card" style={{ maxWidth: '420px', width: '92%', borderRadius: '16px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header no-print" style={{ marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} style={{ color: '#0F172A' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Ticket de Servicio Técnico</h3>
              </div>
              <button type="button" onClick={() => setSelectedRepairForTicket(null)} className="close-modal-btn">
                <X size={18} />
              </button>
            </div>

            {/* Plantilla Formato Térmico POS 80mm */}
            <div className="ticket-repair-printable" id="ticket-reparacion-impresion">
              <div className="ticket-repair-header">
                <h4>Moli Cell</h4>
              </div>

              <div className="ticket-repair-divider"></div>

              <div className="ticket-repair-meta">
                <div className="meta-row">
                  <span>Orden n°:</span>
                  <strong>{selectedRepairForTicket.codigo_seguimiento || selectedRepairForTicket.codigo || `MC-${1000 + selectedRepairForTicket.id}`}</strong>
                </div>
                <div className="meta-row">
                  <span>Fecha Ingreso:</span>
                  <span>
                    {selectedRepairForTicket.creado_en 
                      ? new Date(selectedRepairForTicket.creado_en).toLocaleDateString('es-AR') 
                      : (selectedRepairForTicket.fecha_ingreso ? new Date(selectedRepairForTicket.fecha_ingreso).toLocaleDateString('es-AR') : '—')}
                  </span>
                </div>
              </div>

              <div className="ticket-repair-divider"></div>

              <div className="ticket-repair-box">
                <div className="box-title">Equipo/Dispositivo</div>
                <div className="box-value">{selectedRepairForTicket.dispositivo}</div>
              </div>

              <div className="ticket-repair-box">
                <div className="box-title">Servicio Realizado</div>
                <div className="box-value" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  {selectedRepairForTicket.falla_descripcion || selectedRepairForTicket.falla || selectedRepairForTicket.servicio || selectedRepairForTicket.trabajo_realizado || 'Revisión técnica'}
                </div>
              </div>

              <div className="ticket-repair-divider"></div>

              <div className="ticket-repair-meta" style={{ fontSize: '0.92rem' }}>
                <div className="meta-row">
                  <span style={{ fontWeight: 800 }}>Total:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                    {(() => {
                      const rawTotal = selectedRepairForTicket.costo_estimado ?? selectedRepairForTicket.costoEstimado ?? selectedRepairForTicket.presupuesto_estimado ?? selectedRepairForTicket.precio ?? selectedRepairForTicket.monto;
                      if (rawTotal !== undefined && rawTotal !== null && rawTotal !== '' && !isNaN(Number(rawTotal))) {
                        return `$${Number(rawTotal).toLocaleString('es-AR')}`;
                      }
                      return rawTotal || 'A Confirmar';
                    })()}
                  </strong>
                </div>
              </div>

              <div className="ticket-repair-divider"></div>

              <div className="ticket-repair-footer">
                <p style={{ margin: '8px 0 0 0', fontWeight: 700, fontSize: '0.82rem' }}>¡Gracias por confiar en Moli-Cell!</p>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px', width: '100%' }}>
              <button type="button" onClick={() => setSelectedRepairForTicket(null)} className="btn-cancel" style={{ flex: '1', maxWidth: '130px' }}>
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleTriggerPrint}
                className="btn-save"
                style={{ background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: '1', maxWidth: '180px' }}
              >
                <Printer size={17} />
                <span>Imprimir</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
