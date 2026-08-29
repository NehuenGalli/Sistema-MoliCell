import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Package, 
  Wrench, 
  AlertTriangle, 
  Plus, 
  TrendingUp, 
  ChevronRight,
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { 
  fetchAdminProductos, 
  fetchAdminReparaciones, 
  fetchAdminVentas 
} from '../services/adminApi';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [productos, setProductos] = useState([]);
  const [reparaciones, setReparaciones] = useState([]);
  const [ventasData, setVentasData] = useState({ ventas: [], totalGeneral: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // #16 Fix: estado de error visible

  useEffect(() => {
    loadData();
  }, []);

  // #9 Fix: limitar los datos que carga el dashboard para no traer todo sin necesidad
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, repsResult, vtsResult] = await Promise.all([
        // Solo traer los primeros 50 productos para métricas de stock bajo
        fetchAdminProductos({ incluirInactivos: false }),
        // Solo las últimas 10 reparaciones para la tabla de actividad reciente
        fetchAdminReparaciones({ limit: 10, page: 1 }),
        // Solo la primera página para la tabla, pero también obtenemos totalItems del servidor
        fetchAdminVentas({ limit: 10, page: 1 })
      ]);

      setProductos(prods || []);

      // Normalizar reparaciones (puede venir con o sin paginación)
      const repsArray = Array.isArray(repsResult)
        ? repsResult
        : (repsResult?.servicios || repsResult?.data || []);
      setReparaciones(repsArray);

      // #19 Fix: usar totalItems del servidor en lugar de sumar los items de la página
      const ventasArray = Array.isArray(vtsResult)
        ? vtsResult
        : (vtsResult?.data || vtsResult?.ventas || []);
      const totalItems = vtsResult?.pagination?.totalItems ?? ventasArray.length;
      // Suma del monto de la página visible (solo indicativo)
      const sumaVisible = ventasArray.reduce((acc, v) => acc + (Number(v.monto) || 0), 0);
      setVentasData({ ventas: ventasArray, totalItems, sumaVisible });

    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = productos.filter(p =>
    (p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10) < 10
  );
  const activeRepairs = reparaciones.filter(r => r.estado !== 'Entregado');

  // ── Estado: Cargando ──
  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="dashboard-loading">
          <RefreshCw size={32} className="spin-icon" />
          <p>Cargando datos del panel…</p>
        </div>
      </div>
    );
  }

  // ── Estado: Error ──
  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="dashboard-error-state">
          <ServerCrash size={48} />
          <h3>No se pudo cargar el panel</h3>
          <p>{error}</p>
          <button type="button" onClick={loadData} className="btn-retry">
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      
      {/* Encabezado */}
      <div className="dashboard-welcome-banner">
        <div>
          <h1>Resumen General</h1>
          <p>Bienvenido al centro de control de Moli-Cell.</p>
        </div>
        <div className="banner-quick-actions">
          <Link to="/admin/productos" className="btn-banner-action primary">
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </Link>
          <Link to="/admin/reparaciones" className="btn-banner-action secondary">
            <Wrench size={16} />
            <span>Nueva Orden</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="metrics-grid">
        
        <div className="metric-card">
          <div className="metric-icon-wrap green">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Ventas Registradas</span>
            {/* #19 Fix: mostrar cantidad de ventas del servidor (totalItems), no suma de montos parcial */}
            <h3 className="metric-value">{ventasData.totalItems?.toLocaleString('es-AR') ?? '—'}</h3>
            <span className="metric-subtext positive">
              <TrendingUp size={12} /> pedidos totales
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap blue">
            <Package size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Productos Activos</span>
            <h3 className="metric-value">{productos.length}</h3>
            <span className="metric-subtext">Catálogo en línea</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap orange">
            <Wrench size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Reparaciones Activas</span>
            <h3 className="metric-value">{activeRepairs.length}</h3>
            <span className="metric-subtext warning">En taller o listas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap red">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Stock Bajo</span>
            <h3 className="metric-value">{lowStockProducts.length}</h3>
            <span className="metric-subtext urgent">Requieren reposición</span>
          </div>
        </div>

      </div>

      {/* Grilla 2 Columnas de Actividad Reciente */}
      <div className="dashboard-content-grid">
        
        {/* Columna Izquierda: Últimas Reparaciones */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div>
              <h3>Órdenes de Servicio Recientes</h3>
              <p>Seguimiento de celulares en taller</p>
            </div>
            <Link to="/admin/reparaciones" className="card-link-more">
              Ver todas <ChevronRight size={16} />
            </Link>
          </div>

          {reparaciones.length === 0 ? (
            <div className="empty-state-small">No hay órdenes registradas todavía.</div>
          ) : (
            <div className="card-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th className="col-hide-sm">Dispositivo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reparaciones.slice(0, 5).map(r => (
                    <tr key={r.id || r.codigo_seguimiento}>
                      <td>
                        <strong className="code-pill">{r.codigo_seguimiento || r.codigo}</strong>
                      </td>
                      <td className="truncate-cell">{r.cliente_nombre || r.cliente || '—'}</td>
                      <td className="truncate-cell col-hide-sm">{r.dispositivo}</td>
                      <td>
                        <span className={`table-badge status-${r.estado === 'Listo' || r.estado === 'Entregado' ? 'success' : (r.estado === 'Pendiente' ? 'info' : 'warning')}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha: Alertas de Stock Bajo */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div>
              <h3>Alertas de Inventario</h3>
              <p>Productos con menos de 10 unidades</p>
            </div>
            <Link to="/admin/productos" className="card-link-more">
              Gestionar <ChevronRight size={16} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="empty-state-small">✅ Todos los productos tienen stock suficiente.</div>
          ) : (
            <div className="low-stock-list">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="stock-alert-item">
                  <img 
                    src={p.img_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80'} 
                    alt={p.name}
                    className="stock-thumb"
                    loading="lazy"
                  />
                  <div className="stock-item-info">
                    <strong className="truncate-cell">{p.name}</strong>
                    <span>{p.categorias?.[0]?.name || 'Sin categoría'}</span>
                  </div>
                  <div className={`stock-pill-badge ${p.stock === 0 ? 'stock-zero' : ''}`}>
                    <span>{p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
