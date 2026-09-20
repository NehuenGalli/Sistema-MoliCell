import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Wrench, 
  Receipt, 
  WalletCards,
  ExternalLink, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';
import { useAdminAuth } from '../context/useAdminAuth';
import './AdminLayout.css';
// Las páginas protegidas se cargan con React.lazy, pero sus estilos comparten
// varios selectores globales. Cargarlos una sola vez y en un orden fijo evita
// que la apariencia cambie según el orden en que se visitan las secciones.
import '../pages/AdminDashboardPage.css';
import '../pages/AdminProductsPage.css';
import '../pages/AdminCategoriesBrandsPage.css';
import '../pages/AdminRepairsPage.css';
import '../pages/AdminSalesPage.css';
import '../pages/ManagementPage.css';

// #18 Fix: mapa de rutas → títulos dinámicos para el header
const ROUTE_TITLES = {
  '/admin': 'Resumen General',
  '/admin/productos': 'Gestión de Productos',
  '/admin/categorias-marcas': 'Categorías & Marcas',
  '/admin/reparaciones': 'Servicio Técnico',
  '/admin/ventas': 'Ventas & Pedidos',
  '/admin/gastos': 'Gastos',
};

const getPageTitle = (pathname) => {
  // Busca match exacto o por prefijo
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const prefix = Object.keys(ROUTE_TITLES).find(k => k !== '/admin' && pathname.startsWith(k));
  return prefix ? ROUTE_TITLES[prefix] : 'Panel de Control';
};

export default function AdminLayout() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      navigate('/admin/login');
    } catch {
      setLogoutError('No se pudo cerrar la sesión en el servidor. Intentá nuevamente.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeSidebar = () => setIsMobileSidebarOpen(false);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="admin-app-shell">
      
      {/* ── SIDEBAR LATERAL ── */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="brand-name">MOLI-CELL</span>
            <span className="brand-badge">ADMIN</span>
          </div>
          <button 
            type="button" 
            className="sidebar-close-mobile" 
            onClick={closeSidebar}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Secciones del panel">
          <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Package size={18} />
            <span>Productos</span>
          </NavLink>

          <NavLink to="/admin/categorias-marcas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Tags size={18} />
            <span>Categorías & Marcas</span>
          </NavLink>

          <NavLink to="/admin/reparaciones" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Wrench size={18} />
            <span>Servicio Técnico</span>
          </NavLink>

          <NavLink to="/admin/ventas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Receipt size={18} />
            <span>Ventas & Pedidos</span>
          </NavLink>

          <NavLink to="/admin/gastos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <WalletCards size={18} />
            <span>Gastos</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="nav-link external-link">
            <ExternalLink size={18} />
            <span>Ver Tienda Pública</span>
          </a>

          <button type="button" onClick={handleLogout} className="btn-logout" disabled={isLoggingOut}>
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
          </button>
          {logoutError && <span role="alert" className="field-error-text">{logoutError}</span>}
        </div>
      </aside>

      {/* OVERLAY PARA MOBILE */}
      {isMobileSidebarOpen && (
        <div className="sidebar-mobile-overlay" onClick={closeSidebar} aria-hidden="true"></div>
      )}

      {/* ── CONTENIDO PRINCIPAL Y HEADER ── */}
      <div className="admin-main-wrapper">
        
        <header className="admin-header">
          <div className="header-left">
            <button 
              type="button" 
              className="btn-toggle-menu" 
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            {/* #18 Fix: título dinámico según la ruta actual */}
            <h2 className="header-title">{pageTitle}</h2>
          </div>

          <div className="header-right">
            <div className="admin-user-pill">
              <UserCheck size={18} className="user-icon" />
              <div className="user-info">
                <span className="user-name">{adminUser?.nombre || 'Administrador'}</span>
                <span className="user-role">{adminUser?.email || 'admin@molicell.com'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content-body">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
