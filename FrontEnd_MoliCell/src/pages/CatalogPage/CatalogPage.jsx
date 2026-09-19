import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Tag,
  DollarSign,
  Percent
} from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import './CatalogPage.css';

export default function CatalogPage({ productos, onAddToCart }) {
  const allProducts = useMemo(() => (Array.isArray(productos) ? productos : []), [productos]);
  const [searchParams] = useSearchParams();

  const urlCategory = searchParams.get('categoria') || searchParams.get('category');
  const urlBrand = searchParams.get('marca') || searchParams.get('brand');
  const urlSearch = searchParams.get('buscar') || searchParams.get('q') || searchParams.get('search');
  const urlOffers = searchParams.get('ofertas') === 'true' || searchParams.get('oferta') === 'true' || searchParams.get('descuento') === 'true';

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState(urlSearch || '');
  const [selectedCategories, setSelectedCategories] = useState(urlCategory ? [urlCategory] : []);
  const [selectedBrands, setSelectedBrands] = useState(urlBrand ? [urlBrand] : []);
  const [onlyOffers, setOnlyOffers] = useState(urlOffers);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1500000 });
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(1500000);
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // Estado de Acordeones laterales (Categorías y Marcas ABIERTOS por defecto)
  const [openAccordions, setOpenAccordions] = useState({
    categorias: true,
    marcas: true,
    precio: false,
    descuentos: urlOffers,
  });

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      if (urlCategory) setSelectedCategories([urlCategory]);
      if (urlBrand) setSelectedBrands([urlBrand]);
      if (urlSearch) setSearchTerm(urlSearch);
      if (urlOffers) {
        setOnlyOffers(true);
        setOpenAccordions(prev => ({ ...prev, descuentos: true }));
      }
    }, 0);
    return () => window.clearTimeout(syncTimer);
  }, [urlCategory, urlBrand, urlSearch, urlOffers]);

  const toggleAccordion = (section) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Categorías con conteo robusto
  const categoriesList = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      if (Array.isArray(p.categorias) && p.categorias.length > 0) {
        p.categorias.forEach(c => {
          const cName = typeof c === 'object' ? (c.name || c.nombre) : c;
          if (cName && typeof cName === 'string') {
            const trimmed = cName.trim();
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      } else {
        const cat = p.categoria || p.category;
        if (cat && typeof cat === 'string') {
          const trimmed = cat.trim();
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        } else {
          counts['General'] = (counts['General'] || 0) + 1;
        }
      }
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map(cat => ({ name: cat, count: counts[cat] }));
  }, [allProducts]);

  // Marcas con conteo robusto
  const brandsList = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      const brand = p.marca || p.brand || (typeof p.marca_nombre === 'string' ? p.marca_nombre : null);
      if (brand && typeof brand === 'string' && brand.trim() !== '') {
        const trimmed = brand.trim();
        counts[trimmed] = (counts[trimmed] || 0) + 1;
      } else {
        counts['Otras'] = (counts['Otras'] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map(brand => ({ name: brand, count: counts[brand] }));
  }, [allProducts]);

  // Manejar categorías (checkboxes múltiples)
  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName) 
        : [...prev, categoryName]
    );
  };

  // Manejar marcas (checkboxes múltiples)
  const handleBrandToggle = (brandName) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) 
        ? prev.filter(b => b !== brandName) 
        : [...prev, brandName]
    );
  };

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setOnlyOffers(false);
    setPriceRange({ min: 0, max: 1500000 });
    setAppliedMaxPrice(1500000);
    setSortBy('featured');
  };

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter(p => {
        // Búsqueda de texto
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const name = (p.name || p.nombre || '').toLowerCase();
          const brand = (p.marca || p.brand || '').toLowerCase();
          const cats = Array.isArray(p.categorias)
            ? p.categorias.map(c => typeof c === 'object' ? (c.name || c.nombre) : c).join(' ').toLowerCase()
            : (p.categoria || '').toLowerCase();
          const desc = (p.descripcion || '').toLowerCase();
          if (!name.includes(term) && !brand.includes(term) && !cats.includes(term) && !desc.includes(term)) {
            return false;
          }
        }

        // Categorías (si hay seleccionadas, filtra por ellas; si no, muestra todas por default)
        if (selectedCategories.length > 0) {
          const prodCats = Array.isArray(p.categorias) && p.categorias.length > 0
            ? p.categorias.map(c => typeof c === 'object' ? (c.name || c.nombre) : c)
            : [p.categoria || p.category || 'General'];

          const matchesCat = selectedCategories.some(selectedCat => {
            if (!selectedCat) return false;
            const targetCat = selectedCat.trim().toLowerCase();
            return prodCats.some(catName => {
              if (!catName) return false;
              const norm = catName.trim().toLowerCase();
              return norm === targetCat || norm.includes(targetCat) || targetCat.includes(norm);
            });
          });
          if (!matchesCat) return false;
        }

        // Marcas (si hay seleccionadas, filtra por ellas; si no, muestra todas por default)
        if (selectedBrands.length > 0) {
          const prodBrand = (p.marca || p.brand || (typeof p.marca_nombre === 'string' ? p.marca_nombre : null) || 'Otras').trim().toLowerCase();
          const matchesBrand = selectedBrands.some(b => {
            if (!b) return false;
            const normB = b.trim().toLowerCase();
            return prodBrand === normB || prodBrand.includes(normB) || normB.includes(prodBrand);
          });
          if (!matchesBrand) return false;
        }

        // Ofertas
        if (onlyOffers) {
          const isOffer = p.descuento === true || p.descuento === 'true' || p.descuento === 1;
          if (!isOffer) return false;
        }

        // Precio
        const effectivePrice = p.descuento && p.descuento_precio ? p.descuento_precio : p.precio;
        if (effectivePrice > appliedMaxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.descuento && a.descuento_precio ? a.descuento_precio : a.precio;
        const priceB = b.descuento && b.descuento_precio ? b.descuento_precio : b.precio;
        const nameA = a.name || a.nombre || '';
        const nameB = b.name || b.nombre || '';

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
        if (sortBy === 'featured') {
          const featA = a.destacado || a.es_destacado ? 1 : 0;
          const featB = b.destacado || b.es_destacado ? 1 : 0;
          if (featB !== featA) return featB - featA;
          const descA = a.descuento ? 1 : 0;
          const descB = b.descuento ? 1 : 0;
          return descB - descA;
        }
        return 0;
      });
  }, [allProducts, searchTerm, selectedCategories, selectedBrands, onlyOffers, appliedMaxPrice, sortBy]);

  // Conteo de filtros activos
  const activeFiltersCount = 
    selectedCategories.length +
    selectedBrands.length +
    (onlyOffers ? 1 : 0) +
    (appliedMaxPrice < 1500000 ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  return (
    <div className="catalog-page">
      <div className="catalog-page-container">
        
        {/* Breadcrumb */}
        <nav className="catalog-breadcrumb">
          <Link to="/">Inicio</Link>
          <span className="sep">&gt;</span>
          <span className="active">Catálogo</span>
        </nav>

        {/* Encabezado del Catálogo */}
        <header className="catalog-header">
          <h1 className="catalog-title">Catálogo completo</h1>
          <p className="catalog-subtitle">
            Encontrá smartphones, audio, cargadores, fundas y repuestos con garantía oficial Moli-Cell.
          </p>
        </header>

        {/* ── BARRA UNIFICADA DE BÚSQUEDA Y ORDENAMIENTO (Idéntica a las fotos) ── */}
        <div className="catalog-top-bar">
          
          <div className="top-search-field">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, marca o modelo..."
              className="top-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="search-clear-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="top-controls-right">
            {/* Botón de Filtros para Móviles */}
            <button
              type="button"
              className="btn-mobile-filter-trigger"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={16} />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="mobile-filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            {/* Ordenar por */}
            <div className="top-sort-wrap">
              <span className="sort-label">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="top-sort-select"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name-asc">Nombre: A - Z</option>
              </select>
            </div>
          </div>

        </div>

        {/* ── GRID PRINCIPAL: SIDEBAR DE ACORDEONES + GRILLA DE PRODUCTOS ── */}
        <div className="catalog-content-layout">
          
          {/* ── SIDEBAR CON ACORDEONES (Foto 1 y Foto 2) ── */}
          <aside className="catalog-sidebar">
            <div className="sidebar-accordions-box">
              
              {/* 1. Categorías */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('categorias')}
                >
                  <div className="accordion-title-wrap">
                    <LayoutGrid size={18} className="accordion-icon" />
                    <span>Categorías {selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}</span>
                  </div>
                  {openAccordions.categorias ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.categorias && (
                  <div className="accordion-body animate-slide-down">
                    {categoriesList.map(cat => (
                      <label key={cat.name} className="sidebar-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.name)}
                          onChange={() => handleCategoryToggle(cat.name)}
                        />
                        <span className="custom-box"></span>
                        <span className="checkbox-text">{cat.name} ({cat.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Marcas */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('marcas')}
                >
                  <div className="accordion-title-wrap">
                    <Tag size={18} className="accordion-icon" />
                    <span>Marcas {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                  </div>
                  {openAccordions.marcas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.marcas && (
                  <div className="accordion-body animate-slide-down">
                    {brandsList.map(brand => (
                      <label key={brand.name} className="sidebar-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.name)}
                          onChange={() => handleBrandToggle(brand.name)}
                        />
                        <span className="custom-box"></span>
                        <span className="checkbox-text">{brand.name} ({brand.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Precio */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('precio')}
                >
                  <div className="accordion-title-wrap">
                    <DollarSign size={18} className="accordion-icon" />
                    <span>Precio</span>
                  </div>
                  {openAccordions.precio ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.precio && (
                  <div className="accordion-body animate-slide-down">
                    <div className="price-filter-content">
                      <input
                        type="range"
                        min="5000"
                        max="1500000"
                        step="5000"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                        className="sidebar-price-slider"
                      />
                      <div className="price-slider-labels">
                        <span>$0</span>
                        <span>${priceRange.max.toLocaleString('es-AR')}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAppliedMaxPrice(priceRange.max)}
                        className="btn-apply-price-filter"
                      >
                        Aplicar filtro
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Descuentos */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('descuentos')}
                >
                  <div className="accordion-title-wrap">
                    <Percent size={18} className="accordion-icon" />
                    <span>Descuentos</span>
                  </div>
                  {openAccordions.descuentos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.descuentos && (
                  <div className="accordion-body animate-slide-down">
                    <label className="sidebar-checkbox-label">
                      <input
                        type="checkbox"
                        checked={onlyOffers}
                        onChange={(e) => setOnlyOffers(e.target.checked)}
                      />
                      <span className="custom-box"></span>
                      <span className="checkbox-text">Solo productos en oferta</span>
                    </label>
                  </div>
                )}
              </div>

            </div>

            {/* Botón de Limpiar Filtros abajo */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-sidebar-reset-accordions"
            >
              <RotateCcw size={15} />
              <span>Limpiar filtros</span>
            </button>

          </aside>

          {/* ── ÁREA PRINCIPAL DE PRODUCTOS ── */}
          <main className="catalog-products-main">
            
            <div className="products-results-count">
              <span>Mostrando <strong>{filteredProducts.length}</strong> de {allProducts.length} productos</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="catalog-empty-results">
                <Search size={40} className="empty-search-icon" />
                <h3>No encontramos productos</h3>
                <p>Proba ajustando los filtros o realizando otra búsqueda.</p>
                <button type="button" onClick={handleResetFilters} className="btn-reset-results">
                  <RotateCcw size={16} />
                  <span>Limpiar filtros</span>
                </button>
              </div>
            ) : (
              <div className="catalog-cards-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id_producto || product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            )}

            {/* Paginación (idéntica a las fotos) */}
            {filteredProducts.length > 0 && (
              <div className="catalog-pagination">
                <button type="button" className="pagination-btn nav-arrow" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="pagination-btn active">
                  1
                </button>
                <button type="button" className="pagination-btn nav-arrow" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* ── DRAWER DE FILTROS EN MOBILE ── */}
      {isMobileFilterOpen && (
        <div className="mobile-filter-overlay" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Filtros</h3>
              <button type="button" onClick={() => setIsMobileFilterOpen(false)} className="drawer-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {/* 1. Categorías */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('categorias')}
                >
                  <div className="accordion-title-wrap">
                    <LayoutGrid size={18} className="accordion-icon" />
                    <span>Categorías {selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}</span>
                  </div>
                  {openAccordions.categorias ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.categorias && (
                  <div className="accordion-body animate-slide-down">
                    {categoriesList.map(cat => (
                      <label key={cat.name} className="sidebar-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.name)}
                          onChange={() => handleCategoryToggle(cat.name)}
                        />
                        <span className="custom-box"></span>
                        <span className="checkbox-text">{cat.name} ({cat.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Marcas */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('marcas')}
                >
                  <div className="accordion-title-wrap">
                    <Tag size={18} className="accordion-icon" />
                    <span>Marcas {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                  </div>
                  {openAccordions.marcas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.marcas && (
                  <div className="accordion-body animate-slide-down">
                    {brandsList.map(brand => (
                      <label key={brand.name} className="sidebar-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.name)}
                          onChange={() => handleBrandToggle(brand.name)}
                        />
                        <span className="custom-box"></span>
                        <span className="checkbox-text">{brand.name} ({brand.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Precio */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('precio')}
                >
                  <div className="accordion-title-wrap">
                    <DollarSign size={18} className="accordion-icon" />
                    <span>Precio</span>
                  </div>
                  {openAccordions.precio ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.precio && (
                  <div className="accordion-body animate-slide-down">
                    <div className="price-filter-content">
                      <input
                        type="range"
                        min="5000"
                        max="1500000"
                        step="5000"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                        className="sidebar-price-slider"
                      />
                      <div className="price-slider-labels">
                        <span>$0</span>
                        <span>${priceRange.max.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Descuentos */}
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() => toggleAccordion('descuentos')}
                >
                  <div className="accordion-title-wrap">
                    <Percent size={18} className="accordion-icon" />
                    <span>Descuentos</span>
                  </div>
                  {openAccordions.descuentos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openAccordions.descuentos && (
                  <div className="accordion-body animate-slide-down">
                    <label className="sidebar-checkbox-label">
                      <input
                        type="checkbox"
                        checked={onlyOffers}
                        onChange={(e) => setOnlyOffers(e.target.checked)}
                      />
                      <span className="custom-box"></span>
                      <span className="checkbox-text">Solo productos en oferta</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="drawer-footer">
              <button type="button" onClick={handleResetFilters} className="drawer-btn-reset">
                Limpiar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setAppliedMaxPrice(priceRange.max);
                  setIsMobileFilterOpen(false);
                }} 
                className="drawer-btn-apply"
              >
                Ver ({filteredProducts.length}) resultados
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
