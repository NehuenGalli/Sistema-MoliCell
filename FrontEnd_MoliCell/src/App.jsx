import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Hero from './components/hero/Hero';
import CategoryCarousel from './components/CategoryCarousel/CategoryCarousel';
import Offers from './components/Offers/Offers';
import FeaturedProducts from './components/FeaturedProducts/FeaturedProducts';
import BrandsBar from './components/BrandsBar/BrandsBar';
import ProductCard from './components/ProductCard/ProductCard';
import CartDrawer from './components/CartDrawer/CartDrawer';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import { categoriaService, productoService } from './services';

// Importaciones del Panel de Administración
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';

const ContactPage = lazy(() => import('./pages/ContactPage/ContactPage'));
const ProductPage = lazy(() => import('./pages/ProductPage/ProductPage'));
const TechnicalServicePage = lazy(() => import('./pages/TechnicalServicePage/TechnicalServicePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage/CatalogPage'));
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const AdminLoginPage = lazy(() => import('./admin/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./admin/pages/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./admin/pages/AdminProductsPage'));
const AdminCategoriesBrandsPage = lazy(() => import('./admin/pages/AdminCategoriesBrandsPage'));
const AdminRepairsPage = lazy(() => import('./admin/pages/AdminRepairsPage'));
const AdminSalesPage = lazy(() => import('./admin/pages/AdminSalesPage'));
const AdminExpensesPage = lazy(() => import('./admin/pages/AdminExpensesPage'));

import './App.css';

function RouteLoadingFallback({ admin = false }) {
  return (
    <div
      className={admin ? 'admin-route-fallback' : 'route-fallback'}
      role="status"
      aria-live="polite"
    >
      <span className="route-loading-spinner" aria-hidden="true" />
      Cargando…
    </div>
  );
}

function AdminPageBoundary({ children }) {
  return (
    <Suspense fallback={<RouteLoadingFallback admin />}>
      {children}
    </Suspense>
  );
}

// ─── Componente para la Tienda Pública ────────────────────────────────────
function PublicStoreLayout({ totalCartCount, categorias, isCartOpen, setIsCartOpen, cartItems, handleUpdateQuantity, handleRemoveItem, children }) {
  return (
    <div className="app-container">
      <Navbar
        cartCount={totalCartCount}
        categorias={categorias}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {children}

      <Footer categorias={categorias} />
    </div>
  );
}

// ─── Página principal (Home) ───────────────────────────────────────────────
function HomePage({ productos, loading, handleAddToCart }) {
  const catalogList = productos || [];

  return (
    <main>
      <Hero />
      <CategoryCarousel />

      {/* Sección de Ofertas */}
      <Offers productos={productos} onAddToCart={handleAddToCart} />

      {/* Sección de Destacados */}
      <FeaturedProducts
        productos={productos}
        onAddToCart={handleAddToCart}
      />

      {/* Barra de Nuestras Marcas */}
      <BrandsBar />

      {/* Sección de Catálogo / Productos */}
      <section id="catalogo" className="catalog-section">
        <div className="catalog-container">
          <h2>Catálogo Completo</h2>
          {loading ? (
            <p>Cargando productos del catálogo...</p>
          ) : catalogList.length === 0 ? (
            <p className="no-products-msg">No hay productos disponibles actualmente en la tienda.</p>
          ) : (
            <div className="products-grid">
              {catalogList.map((prod) => (
                <ProductCard 
                  key={prod.id_producto || prod.id} 
                  product={prod} 
                  onAddToCart={handleAddToCart} 
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── App principal ─────────────────────────────────────────────────────────
function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const needsCatalogData = location.pathname === '/' || location.pathname === '/catalogo';
  const categoriesLoaded = useRef(false);
  const productsLoaded = useRef(false);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [cartItems, setCartItems] = useState([]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existing = prevItems.find(item => String(item.id) === String(product.id));
      if (existing) {
        return prevItems.map(item =>
          String(item.id) === String(product.id)
            ? { ...item, cantidad: item.cantidad + (product.cantidad || 1) }
            : item
        );
      }
      return [...prevItems, { 
        id: product.id,
        nombre: product.nombre || product.name,
        precio: product.precio,
        imagen: product.imagen || product.img_url,
        cantidad: product.cantidad || 1 
      }];
    });
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return;
    setCartItems(prevItems =>
      prevItems.map(item =>
        String(item.id) === String(id) ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => String(item.id) !== String(id)));
  };

  useEffect(() => {
    if (isAdminRoute) return;
    if (categoriesLoaded.current && (!needsCatalogData || productsLoaded.current)) return;
    let active = true;
    if (needsCatalogData && !productsLoaded.current) setLoading(true);
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          categoriesLoaded.current ? Promise.resolve(null) : categoriaService.obtenerCategorias(),
          needsCatalogData && !productsLoaded.current ? productoService.obtenerProductos() : Promise.resolve(null)
        ]);
        if (!active) return;
        if (Array.isArray(cats)) {
          setCategorias(cats);
          categoriesLoaded.current = true;
        }
        if (Array.isArray(prods)) {
          setProductos(prods);
          productsLoaded.current = true;
        }
      } catch (error) {
        console.error('Error al conectar con el backend:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [isAdminRoute, needsCatalogData]);

  return (
    <AdminAuthProvider>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback admin={isAdminRoute} />}>
        <Routes>
        {/* ── RUTAS PÚBLICAS DE LA TIENDA ── */}
        <Route
          path="/"
          element={
            <PublicStoreLayout
              totalCartCount={totalCartCount}
              categorias={categorias}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              cartItems={cartItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            >
              <HomePage
                productos={productos}
                loading={loading}
                handleAddToCart={handleAddToCart}
              />
            </PublicStoreLayout>
          }
        />
        <Route
          path="/catalogo"
          element={
            <PublicStoreLayout
              totalCartCount={totalCartCount}
              categorias={categorias}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              cartItems={cartItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            >
              <CatalogPage productos={productos} onAddToCart={handleAddToCart} />
            </PublicStoreLayout>
          }
        />
        <Route
          path="/contacto"
          element={
            <PublicStoreLayout
              totalCartCount={totalCartCount}
              categorias={categorias}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              cartItems={cartItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            >
              <ContactPage />
            </PublicStoreLayout>
          }
        />
        <Route
          path="/servicio-tecnico"
          element={
            <PublicStoreLayout
              totalCartCount={totalCartCount}
              categorias={categorias}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              cartItems={cartItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            >
              <TechnicalServicePage />
            </PublicStoreLayout>
          }
        />
        <Route
          path="/producto/:id"
          element={
            <PublicStoreLayout
              totalCartCount={totalCartCount}
              categorias={categorias}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              cartItems={cartItems}
              handleUpdateQuantity={handleUpdateQuantity}
              handleRemoveItem={handleRemoveItem}
            >
              <ProductPage
                productos={productos}
                onAddToCart={handleAddToCart}
                onOpenCart={() => setIsCartOpen(true)}
              />
            </PublicStoreLayout>
          }
        />

        {/* ── RUTAS DEL PANEL DE ADMINISTRACIÓN ── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminPageBoundary><AdminDashboardPage /></AdminPageBoundary>} />
          <Route path="productos" element={<AdminPageBoundary><AdminProductsPage /></AdminPageBoundary>} />
          <Route path="categorias-marcas" element={<AdminPageBoundary><AdminCategoriesBrandsPage /></AdminPageBoundary>} />
          <Route path="reparaciones" element={<AdminPageBoundary><AdminRepairsPage /></AdminPageBoundary>} />
          <Route path="ventas" element={<AdminPageBoundary><AdminSalesPage /></AdminPageBoundary>} />
          <Route path="gastos" element={<AdminPageBoundary><AdminExpensesPage /></AdminPageBoundary>} />
        </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}

export default App;
