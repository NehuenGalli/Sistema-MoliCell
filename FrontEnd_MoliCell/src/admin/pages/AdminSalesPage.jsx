import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Printer, 
  Receipt, 
  DollarSign, 
  ShoppingBag, 
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  Eye
} from 'lucide-react';
import { fetchAdminVentas, createAdminVenta } from '../services/adminApi';
import { productoService } from '../../services/productoService';
import { printThermalTicket } from '../utils/printThermalTicket';

export default function AdminSalesPage() {
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorLoad, setErrorLoad] = useState('');

  // Panel Drawer Lateral Izquierdo de Filtros Avanzados
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [filterParams, setFilterParams] = useState({
    periodo: 'todas', // 'todas', 'semana', 'mes', 'dia'
    fecha: '',
    metodoPago: 'todos', // 'todos', 'Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta de Débito', 'Tarjeta de Crédito'
    minMonto: '',
    maxMonto: ''
  });

  // Estado de Paginación en Servidor (Default: 15 ventas por página)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15
  });

  // Modal Nueva Venta
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [newSale, setNewSale] = useState({
    codigo_venta: '',
    metodo_pago: 'Efectivo',
    items: [],
    selectedQuantity: 1
  });

  // Modal Ticket (Impresión) y Modal Detalles
  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState(null);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState(null);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });

  const getSaleProfit = (sale) => {
    if (!sale) return 0;
    if (sale.ganancia !== undefined && sale.ganancia !== null) {
      return Number(sale.ganancia);
    }
    const total = Number(sale.monto) || 0;
    const cost = Array.isArray(sale.productos)
      ? sale.productos.reduce((sum, p) => sum + ((Number(p.precio_costo) || 0) * (Number(p.cantidad) || 1)), 0)
      : 0;
    return total - cost;
  };

  const getSaleCost = (sale) => {
    if (!sale) return 0;
    if (sale.costo_total !== undefined && sale.costo_total !== null) {
      return Number(sale.costo_total);
    }
    return Array.isArray(sale.productos)
      ? sale.productos.reduce((sum, p) => sum + ((Number(p.precio_costo) || 0) * (Number(p.cantidad) || 1)), 0)
      : 0;
  };

  const loadData = async (params = {}) => {
    setLoading(true);
    setErrorLoad('');
    try {
      const salesRes = await fetchAdminVentas(params);

      // Extraer datos y metadatos de paginación del servidor
      if (salesRes && salesRes.pagination) {
        setVentas(salesRes.data || []);
        setPagination(salesRes.pagination);
      } else if (salesRes && Array.isArray(salesRes.data)) {
        setVentas(salesRes.data);
      } else if (Array.isArray(salesRes)) {
        setVentas(salesRes);
      }

    } catch (err) {
      setErrorLoad(err.message || 'Error al obtener el historial de ventas del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 3500);
  };

  // Aplicar Filtros Combinados y Paginación en Backend (PostgreSQL SQL)
  const handleApplyServerFilters = (
    customFilterParams = filterParams, 
    searchVal = searchTerm, 
    targetPage = 1
  ) => {
    const params = {
      page: targetPage,
      limit: 15
    };

    if (customFilterParams.periodo === 'semana') params.filtro = 'semana';
    if (customFilterParams.periodo === 'mes') params.filtro = 'mes';
    if (customFilterParams.periodo === 'dia' && customFilterParams.fecha) params.fecha = customFilterParams.fecha;

    if (customFilterParams.metodoPago && customFilterParams.metodoPago !== 'todos') {
      params.metodo_pago = customFilterParams.metodoPago;
    }

    if (customFilterParams.minMonto !== '') params.min_monto = customFilterParams.minMonto;
    if (customFilterParams.maxMonto !== '') params.max_monto = customFilterParams.maxMonto;

    if (searchVal.trim()) {
      params.search = searchVal.trim();
    }

    loadData(params);
  };

  // Manejar cambio de filtro de fecha (Petición Backend)
  const handlePeriodoChange = (periodo, customDate = '') => {
    const updatedParams = { ...filterParams, periodo, fecha: customDate };
    setFilterParams(updatedParams);
    handleApplyServerFilters(updatedParams, searchTerm, 1);
  };

  // Restablecer Filtros
  const handleResetFilters = () => {
    const defaultParams = {
      periodo: 'todas',
      fecha: '',
      metodoPago: 'todos',
      minMonto: '',
      maxMonto: ''
    };
    setFilterParams(defaultParams);
    if (searchTerm) {
      setSearchTerm('');
    } else {
      handleApplyServerFilters(defaultParams, '', 1);
    }
  };

  // Debounce para búsqueda en servidor por término
  useEffect(() => {
    const timer = setTimeout(() => {
      handleApplyServerFilters(filterParams, searchTerm, 1);
    }, 350);
    return () => clearTimeout(timer);
    // Los demás filtros se envían desde sus controles; incluirlos aquí haría
    // una segunda petición cada vez que el usuario confirma un filtro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Calcular número de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterParams.periodo !== 'todas') count++;
    if (filterParams.metodoPago !== 'todos') count++;
    if (filterParams.minMonto !== '') count++;
    if (filterParams.maxMonto !== '') count++;
    return count;
  }, [filterParams]);

  // Métricas
  const totalRevenue = ventas.reduce((acc, v) => acc + (Number(v.monto) || 0), 0);
  const totalProductsSold = ventas.reduce((acc, v) => {
    const itemCount = Array.isArray(v.productos)
      ? v.productos.reduce((sum, p) => sum + (Number(p.cantidad) || 0), 0)
      : 0;
    return acc + itemCount;
  }, 0);

  // Estado de resultados de búsqueda paginada desde el servidor (LIMIT 8)
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Debounce de 300ms: Búsqueda súper optimizada en base de datos con LIMIT 8
  useEffect(() => {
    if (!isNewSaleModalOpen) return;

    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const results = await productoService.obtenerProductos({
          q: productSearchInput.trim(),
          limit: 8
        });
        setSearchedProducts(results || []);
      } catch (err) {
        console.error('Error al buscar productos en backend:', err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearchInput, isNewSaleModalOpen]);

  // Abrir Modal Nueva Venta
  const handleOpenNewSaleModal = () => {
    setProductSearchInput('');
    setNewSale({
      codigo_venta: `VEN-${Math.floor(1000 + Math.random() * 9000)}`,
      metodo_pago: 'Efectivo',
      items: [],
      selectedQuantity: 1
    });
    setIsNewSaleModalOpen(true);
  };

  // Agregar producto directamente a la venta desde la lista de resultados
  const handleAddDirectProductToSale = (prod) => {
    if (!prod) return;

    const qty = Math.max(1, parseInt(newSale.selectedQuantity, 10) || 1);
    
    // Verificar stock disponible
    if (prod.stock !== undefined && prod.stock !== null && qty > prod.stock) {
      showToast(`Stock insuficiente. Solo quedan ${prod.stock} unidades de "${prod.name || prod.nombre}".`, 'error');
      return;
    }

    const unitPrice = Number(prod.descuento && prod.descuento_precio ? prod.descuento_precio : prod.precio);

    setNewSale(prev => {
      const existingIdx = prev.items.findIndex(i => String(i.producto_id) === String(prod.id || prod.id_producto));
      let updatedItems = [...prev.items];

      if (existingIdx >= 0) {
        const existingItem = updatedItems[existingIdx];
        const newQty = existingItem.cantidad + qty;

        if (prod.stock !== undefined && prod.stock !== null && newQty > prod.stock) {
          showToast(`No podés agregar más de ${prod.stock} unidades de "${prod.name || prod.nombre}".`, 'error');
          return prev;
        }

        updatedItems[existingIdx] = {
          ...existingItem,
          cantidad: newQty,
          subtotal: newQty * unitPrice
        };
      } else {
        updatedItems.push({
          producto_id: prod.id || prod.id_producto,
          name: prod.name || prod.nombre,
          precio: unitPrice,
          cantidad: qty,
          subtotal: qty * unitPrice
        });
      }

      return { ...prev, items: updatedItems };
    });

    showToast(`Agregado: ${prod.name || prod.nombre}`, 'success');
  };

  // Eliminar ítem de la venta borrador
  const handleRemoveItemFromSale = (index) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Registrar Venta Final en Backend
  const handleSaveSale = async (e) => {
    e.preventDefault();
    if (newSale.items.length === 0) {
      showToast('Debés agregar al menos un producto a la venta.', 'error');
      return;
    }

    const totalAmount = newSale.items.reduce((sum, item) => sum + item.subtotal, 0);

    const payload = {
      codigo_venta: newSale.codigo_venta || `VEN-${Math.floor(1000 + Math.random() * 9000)}`,
      monto: totalAmount,
      metodo_pago: newSale.metodo_pago,
      productos: newSale.items.map(item => ({
        producto_id: parseInt(item.producto_id, 10),
        cantidad: parseInt(item.cantidad, 10)
      }))
    };

    try {
      const saleCreated = await createAdminVenta(payload);
      showToast('¡Venta registrada exitosamente!', 'success');
      setIsNewSaleModalOpen(false);
      
      handleApplyServerFilters(filterParams, searchTerm, 1);
      if (saleCreated) {
        setSelectedSaleForTicket(saleCreated);
      }
    } catch (err) {
      showToast(err.message || 'Error al registrar la venta en la base de datos', 'error');
    }
  };

  // Imprimir Ticket térmico dinámico (tipo Treinta / POS)
  const handleTriggerPrint = () => {
    printThermalTicket('ticket-impresion');
  };

  // Petición directa al servidor PostgreSQL (100% Server-Side SQL Filtering)
  const filteredSales = ventas;

  return (
    <div className="admin-sales-page">

      {/* Toast Notificación */}
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

      {/* Banner de error de carga */}
      {errorLoad && (
        <div className="admin-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Fallo al cargar ventas</strong>
              <span style={{ fontSize: '0.85rem' }}>{errorLoad}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => loadData()} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#991B1B', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={15} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Header & Botón de Nueva Venta */}
      <div className="page-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '1.4rem', color: '#0F172A' }}>
            Ventas & Registro de Caja
          </h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
            Registrá ventas de caja, consultá el historial y emití tickets de comprobante.
          </p>
        </div>

        <button 
          type="button" 
          onClick={handleOpenNewSaleModal} 
          className="btn-add-main"
        >
          <Plus size={18} />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Métricas Recaudación */}
      <div className="sales-metrics-banner">
        <div className="banner-stat">
          <DollarSign size={24} className="stat-icon" />
          <div>
            <span>Total Recaudado</span>
            <h3>${totalRevenue.toLocaleString('es-AR')}</h3>
          </div>
        </div>

        <div className="banner-stat">
          <Receipt size={24} className="stat-icon" />
          <div>
            <span>Total Ventas</span>
            <h3>{pagination.totalItems > 0 ? pagination.totalItems : ventas.length} ventas</h3>
          </div>
        </div>

        <div className="banner-stat">
          <ShoppingBag size={24} className="stat-icon" />
          <div>
            <span>Productos Vendidos</span>
            <h3>{totalProductsSold} unidades</h3>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Menú Desplegable de Filtros */}
      <div className="products-table-controls">
        
        {/* Botón de Filtros a la IZQUIERDA en Mobile y Desktop */}
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

        {/* Buscador a la DERECHA */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de venta o medio de pago..."
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="clear-btn">
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      {/* Panel Drawer Lateral IZQUIERDO de Filtros (Estilo Catálogo) */}
      {isFilterMenuOpen && (
        <div className="filter-drawer-overlay" onClick={() => setIsFilterMenuOpen(false)}>
          <div className="filter-drawer-panel left-side" onClick={(e) => e.stopPropagation()}>
            
            <div className="filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} style={{ color: '#0F172A' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Opciones de Filtro</h4>
              </div>
              <button type="button" onClick={() => setIsFilterMenuOpen(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <div className="filter-drawer-body">
              
              {/* 1. Período / Fecha */}
              <div className="filter-field-group">
                <label>Rango de Fecha</label>
                <select
                  value={filterParams.periodo}
                  onChange={(e) => handlePeriodoChange(e.target.value, filterParams.fecha)}
                >
                  <option value="todas">Todas las fechas</option>
                  <option value="semana">Última Semana</option>
                  <option value="mes">Último Mes</option>
                  <option value="dia">Día Específico</option>
                </select>

                {filterParams.periodo === 'dia' && (
                  <input
                    type="date"
                    value={filterParams.fecha}
                    onChange={(e) => handlePeriodoChange('dia', e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                )}
              </div>

              {/* 2. Método de Pago */}
              <div className="filter-field-group">
                <label>Forma de Pago</label>
                <select
                  value={filterParams.metodoPago}
                  onChange={(e) => setFilterParams(prev => ({ ...prev, metodoPago: e.target.value }))}
                >
                  <option value="todos">Todos los medios</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                </select>
              </div>

              {/* 3. Rango de Monto / Precio */}
              <div className="filter-field-group">
                <label>Rango de Precio ($)</label>
                <div className="filter-price-inputs">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filterParams.minMonto}
                    onChange={(e) => setFilterParams(prev => ({ ...prev, minMonto: e.target.value }))}
                  />
                  <span style={{ color: '#94A3B8' }}>—</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filterParams.maxMonto}
                    onChange={(e) => setFilterParams(prev => ({ ...prev, maxMonto: e.target.value }))}
                  />
                </div>
              </div>

            </div>

            {/* Footer de Acciones del Drawer */}
            <div className="filter-drawer-footer">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-reset-filters"
              >
                <RotateCcw size={14} /> Limpiar Todo
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyServerFilters(filterParams, searchTerm, 1);
                  setIsFilterMenuOpen(false);
                }}
                className="btn-apply-filters"
              >
                Aplicar Filtros
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tabla de Historial de Ventas */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-state" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
            Cargando historial de ventas...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
            No se encontraron ventas para los filtros seleccionados.
          </div>
        ) : (
          <table className="admin-table sales-table">
            <thead>
              <tr>
                <th className="col-venta" style={{ textAlign: 'center' }}>Venta</th>
                <th className="col-fecha" style={{ textAlign: 'center' }}>Fecha</th>
                <th className="col-pago" style={{ textAlign: 'center' }}>Pago</th>
                <th className="col-monto" style={{ textAlign: 'center' }}>Monto Total</th>
                <th className="col-ganancia" style={{ textAlign: 'center' }}>Ganancia</th>
                <th className="col-acciones" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((v) => {
                const profit = getSaleProfit(v);
                return (
                  <tr key={v.id}>
                    <td className="col-venta" style={{ textAlign: 'center' }}>
                      <strong className="code-pill">
                        {v.codigo_venta || `VEN-${1000 + v.id}`}
                      </strong>
                    </td>
                    <td className="col-fecha" style={{ textAlign: 'center' }}>
                      <span className="date-text" style={{ fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                        {v.creado_en ? new Date(v.creado_en).toLocaleDateString('es-AR') : v.fecha}
                      </span>
                    </td>
                    <td className="col-pago" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                        {v.metodo_pago || '—'}
                      </span>
                    </td>
                    <td className="col-monto" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                        ${Number(v.monto).toLocaleString('es-AR')}
                      </strong>
                    </td>
                    <td className="col-ganancia" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontWeight: 800, color: profit >= 0 ? '#166534' : '#DC2626', fontSize: '0.92rem' }}>
                        ${profit.toLocaleString('es-AR')}
                      </strong>
                    </td>
                    <td className="col-acciones" style={{ textAlign: 'center' }}>
                      <div className="sale-row-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForDetails(v)}
                          className="btn-action-details"
                          title="Ver detalles de la venta"
                        >
                          <Eye size={15} />
                          <span>Detalles</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForTicket(v)}
                          className="btn-action-ticket"
                          title="Imprimir Comprobante de Venta"
                        >
                          <Printer size={15} />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Control de Paginación en Servidor (15 registros por página) */}
      {pagination.totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            Página {pagination.currentPage} de {pagination.totalPages} (Total: {pagination.totalItems} ventas)
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => handleApplyServerFilters(filterParams, searchTerm, pagination.currentPage - 1)}
              className="pagination-btn"
            >
              ← Anterior
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, pagination.currentPage - 3), Math.min(pagination.totalPages, pagination.currentPage + 2))
              .map(pageNo => (
                <button
                  key={pageNo}
                  type="button"
                  className={`pagination-btn ${pageNo === pagination.currentPage ? 'active' : ''}`}
                  onClick={() => handleApplyServerFilters(filterParams, searchTerm, pageNo)}
                >
                  {pageNo}
                </button>
            ))}

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => handleApplyServerFilters(filterParams, searchTerm, pagination.currentPage + 1)}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL REGISTRAR NUEVA VENTA ── */}
      {isNewSaleModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsNewSaleModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '680px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3><ShoppingBag size={20} style={{ marginRight: '6px' }} /> Registrar Nueva Venta</h3>
              <button type="button" onClick={() => setIsNewSaleModalOpen(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="modal-form">
              
              <div className="form-group">
                <label>Método de Pago *</label>
                <select
                  value={newSale.metodo_pago}
                  onChange={(e) => setNewSale(prev => ({ ...prev, metodo_pago: e.target.value }))}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                </select>
              </div>

              {/* Selector de Producto con Búsqueda Escribible en Vivo (0 db queries) */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                
                {/* 1. Header con Título */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontSize: '0.92rem' }}>
                    Búsqueda Instantánea de Producto
                  </label>
                </div>
                
                {/* 2. Campo de búsqueda escribible (ARRIBA de la lista) */}
                <div className="search-box" style={{ marginBottom: '12px', maxWidth: '100%', order: 0 }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    value={productSearchInput}
                    onChange={(e) => setProductSearchInput(e.target.value)}
                    placeholder="Escribí para buscar productos relacionados..."
                    style={{ background: '#FFFFFF', paddingLeft: '36px' }}
                  />
                  {productSearchInput && (
                    <button type="button" onClick={() => setProductSearchInput('')} className="clear-btn">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 3. Lista interactiva de productos filtrados: Título arriba, Imagen y Botón Agregar abajo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {isSearchingProducts ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                      Buscando en catálogo...
                    </div>
                  ) : searchedProducts.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                      {productSearchInput ? `Sin coincidencias para "${productSearchInput}".` : 'Ingresá un término para buscar.'}
                    </div>
                  ) : (
                    searchedProducts.map(p => {
                      const finalPrice = Number(p.descuento && p.descuento_precio ? p.descuento_precio : p.precio);
                      const isOutOfStock = p.stock !== undefined && p.stock <= 0;

                      return (
                        <div 
                          key={p.id || p.id_producto}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* Fila 1: Título completo */}
                          <strong style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 800, wordBreak: 'break-word' }}>
                            {p.name || p.nombre}
                          </strong>

                          {/* Fila 2: Imagen e info a la izquierda, Botón Agregar a la derecha */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img 
                                src={p.img_url || p.imagen || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&q=80'} 
                                alt={p.name || p.nombre}
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                              />
                              <div>
                                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#166534', fontWeight: 800 }}>
                                  ${finalPrice.toLocaleString('es-AR')}
                                </strong>
                                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                  Stock: {p.stock !== undefined ? p.stock : 0} un.
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleAddDirectProductToSale(p)}
                              style={{
                                padding: '8px 14px',
                                background: isOutOfStock ? '#94A3B8' : '#0F172A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0
                              }}
                            >
                              <Plus size={15} />
                              <span>Agregar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

              {/* Tabla de Ítems en la Venta */}
              <div className="form-group">
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Detalle del Carrito de Venta</label>
                
                {newSale.items.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#FFF', border: '1px dashed #CBD5E1', borderRadius: '6px', color: '#64748B', fontSize: '0.85rem' }}>
                    Sin productos en el carrito. Buscá arriba y hacé clic en "+ Agregar".
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Producto</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>P. Unit</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newSale.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.cantidad}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>${item.precio.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromSale(idx)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Total de la Venta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1F5F9', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', letterSpacing: '0.2px' }}>TOTAL A COBRAR:</span>
                <strong style={{ fontSize: '1.05rem', color: '#166534', fontWeight: 800 }}>
                  ${newSale.items.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('es-AR')}
                </strong>
              </div>

              {/* Botones del Footer Centrados (Recuadrar Naranja) */}
              <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', width: '100%' }}>
                <button type="button" onClick={() => setIsNewSaleModalOpen(false)} className="btn-cancel" style={{ flex: '1', maxWidth: '160px' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" style={{ background: '#166534', flex: '1', maxWidth: '180px' }}>
                  Registrar Venta
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL DETALLES DE VENTA ── */}
      {selectedSaleForDetails && (
        <div className="admin-modal-overlay sale-details-modal-overlay" onClick={() => setSelectedSaleForDetails(null)}>
          <div className="admin-modal-card sale-details-modal-card" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header sale-details-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} style={{ color: '#0F172A' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  Detalle de Venta: {selectedSaleForDetails.codigo_venta || `VEN-${1000 + selectedSaleForDetails.id}`}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedSaleForDetails(null)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <div className="sale-details-modal-body">
              
              {/* Resumen de Información en Tarjetas */}
              <div className="sale-details-grid">
                <div className="sale-details-stat-box">
                  <span className="stat-box-label">Fecha</span>
                  <strong className="stat-box-value">
                    {selectedSaleForDetails.creado_en 
                      ? new Date(selectedSaleForDetails.creado_en).toLocaleDateString('es-AR') 
                      : (selectedSaleForDetails.fecha ? new Date(selectedSaleForDetails.fecha).toLocaleDateString('es-AR') : '—')}
                  </strong>
                </div>

                <div className="sale-details-stat-box">
                  <span className="stat-box-label">Método de Pago</span>
                  <strong className="stat-box-value">
                    {selectedSaleForDetails.metodo_pago || '—'}
                  </strong>
                </div>

                <div className="sale-details-stat-box">
                  <span className="stat-box-label">Total Venta</span>
                  <strong className="stat-box-value highlight-dark">
                    ${Number(selectedSaleForDetails.monto).toLocaleString('es-AR')}
                  </strong>
                </div>

                <div className="sale-details-stat-box">
                  <span className="stat-box-label">Costo Total</span>
                  <strong className="stat-box-value">
                    ${getSaleCost(selectedSaleForDetails).toLocaleString('es-AR')}
                  </strong>
                </div>

                <div className="sale-details-stat-box">
                  <span className="stat-box-label label-profit">Ganancia</span>
                  <strong className={`stat-box-value ${getSaleProfit(selectedSaleForDetails) >= 0 ? 'highlight-green' : 'highlight-red'}`}>
                    ${getSaleProfit(selectedSaleForDetails).toLocaleString('es-AR')}
                  </strong>
                </div>
              </div>

              {/* Lista de Productos Involucrados */}
              <div className="sale-details-products-section">
                <label className="sale-details-section-title">
                  Productos en la Venta ({Array.isArray(selectedSaleForDetails.productos) ? selectedSaleForDetails.productos.length : 0})
                </label>
                
                {Array.isArray(selectedSaleForDetails.productos) && selectedSaleForDetails.productos.length > 0 ? (
                  <div className="sale-details-table-wrapper">
                    <table className="sale-details-table">
                      <thead>
                        <tr>
                          <th className="col-dt-prod" style={{ textAlign: 'left' }}>Producto</th>
                          <th className="col-dt-cant" style={{ textAlign: 'center' }}>Cant.</th>
                          <th className="col-dt-precio" style={{ textAlign: 'right' }}>Precio</th>
                          <th className="col-dt-costo" style={{ textAlign: 'right' }}>P. Costo</th>
                          <th className="col-dt-subtotal" style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSaleForDetails.productos.map((p, idx) => {
                          const cant = Number(p.cantidad) || 1;
                          const pVenta = Number(p.precio) || 0;
                          const pCosto = Number(p.precio_costo) || 0;
                          const sub = cant * pVenta;
                          return (
                            <tr key={idx}>
                              <td className="col-dt-prod col-prod-name">
                                {p.name || `Producto #${p.producto_id}`}
                              </td>
                              <td className="col-dt-cant" style={{ textAlign: 'center', fontWeight: 600 }}>
                                {cant}
                              </td>
                              <td className="col-dt-precio" style={{ textAlign: 'right', fontWeight: 600 }}>
                                ${pVenta.toLocaleString('es-AR')}
                              </td>
                              <td className="col-dt-costo" style={{ textAlign: 'right', color: '#64748B' }}>
                                ${pCosto.toLocaleString('es-AR')}
                              </td>
                              <td className="col-dt-subtotal" style={{ textAlign: 'right', fontWeight: 700 }}>
                                ${sub.toLocaleString('es-AR')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sale-details-empty">
                    No hay información de productos disponible para esta venta.
                  </div>
                )}
              </div>

            </div>

            {/* Botones de Acción del Modal */}
            <div className="sale-details-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedSaleForDetails(null)}
                className="btn-cancel"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const sale = selectedSaleForDetails;
                  setSelectedSaleForDetails(null);
                  setSelectedSaleForTicket(sale);
                }}
                className="btn-save btn-print-direct"
              >
                <Printer size={15} />
                <span>Imprimir</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL IMPRESIÓN DE TICKET (58MM) ── */}
      {selectedSaleForTicket && (
        <div className="admin-modal-overlay ticket-pos-modal-overlay" onClick={() => setSelectedSaleForTicket(null)}>
          <div className="admin-modal-card ticket-pos-modal-card" style={{ maxWidth: '360px', width: '92%', borderRadius: '16px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header no-print" style={{ marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} style={{ color: '#0F172A' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Ticket de Comprobante</h3>
              </div>
              <button type="button" onClick={() => setSelectedSaleForTicket(null)} className="close-modal-btn">
                <X size={18} />
              </button>
            </div>

            {/* Plantilla Formato Térmico Comprobante 58mm (Gadnic IT1050) */}
            <div className="ticket-pos-printable" id="ticket-impresion">
              <div className="ticket-header">
                <h4>MOLI CELL</h4>
                <div className="ticket-subtitle">Comprobante de Venta</div>
              </div>

              <div className="ticket-divider"></div>

              <div className="ticket-meta">
                <div className="meta-row">
                  <span>Ticket n°:</span>
                  <strong>{selectedSaleForTicket.codigo_venta || `VEN-${1000 + selectedSaleForTicket.id}`}</strong>
                </div>
                <div className="meta-row">
                  <span>Fecha:</span>
                  <span>{selectedSaleForTicket.creado_en ? new Date(selectedSaleForTicket.creado_en).toLocaleDateString('es-AR') : (selectedSaleForTicket.fecha ? new Date(selectedSaleForTicket.fecha).toLocaleDateString('es-AR') : '—')}</span>
                </div>
                <div className="meta-row">
                  <span>Medio de pago:</span>
                  <strong>{selectedSaleForTicket.metodo_pago || 'Efectivo'}</strong>
                </div>
              </div>

              <div className="ticket-divider"></div>

              <table className="ticket-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Cant</th>
                    <th style={{ width: '52%' }}>Producto</th>
                    <th style={{ textAlign: 'right', width: '33%' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selectedSaleForTicket.productos) && selectedSaleForTicket.productos.length > 0 ? (
                    selectedSaleForTicket.productos.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{p.cantidad}x</td>
                        <td style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{p.name || `Producto #${p.producto_id}`}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ${(Number(p.precio || 0) * Number(p.cantidad || 1)).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#64748B', padding: '6px 0' }}>Venta registrada en sistema</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="ticket-divider"></div>

              <div className="ticket-total-box">
                <span>TOTAL:</span>
                <strong>${Number(selectedSaleForTicket.monto).toLocaleString('es-AR')}</strong>
              </div>

              <div className="ticket-footer">
                <p style={{ fontWeight: 700, margin: '4px 0 0 0' }}>¡MUCHAS GRACIAS POR SU COMPRA!</p>
              </div>
            </div>

            <div className="ticket-printer-hint no-print">
              <span>Formato 58mm · Compatible Gadnic IT1050</span>
            </div>

            <div className="modal-footer no-print" style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '10px', width: '100%' }}>
              <button type="button" onClick={() => setSelectedSaleForTicket(null)} className="btn-cancel" style={{ flex: '1', maxWidth: '120px' }}>
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleTriggerPrint}
                className="btn-save"
                style={{ background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: '1', maxWidth: '160px' }}
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
