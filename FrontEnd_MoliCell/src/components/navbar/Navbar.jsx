import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import logoImg from '../../assets/downloadgram.org_658663834_18073324010265668_3678219278523067320_n.jpg';
import './Navbar.css';

const Navbar = ({ cartCount = 0, categorias = [], onOpenCart }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
    const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownTimeoutRef = useRef(null);

    // Bloquear scroll cuando el menú mobile está abierto
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleMouseEnterCategories = () => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setIsCategoriesDropdownOpen(true);
    };

    const handleMouseLeaveCategories = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setIsCategoriesDropdownOpen(false);
        }, 150);
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
        setIsMobileCategoriesOpen(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/catalogo?buscar=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
            closeMobileMenu();
        }
    };

    const handleCategoryClick = (categoryName) => {
        setIsCategoriesDropdownOpen(false);
        closeMobileMenu();
        navigate(`/catalogo?categoria=${encodeURIComponent(categoryName)}`);
    };

    return (
        <header className="site-header">
            <div className="navbar-aurora">
                {/* ─── DESKTOP NAVBAR ─── */}
                <div className="navbar-desktop-container">
                    
                    {/* Logo & Marca Izquierda */}
                    <Link to="/" className="brand-logo-wrap">
                        <img src={logoImg} alt="Moli-Cell Logo" className="navbar-brand-logo-img" />
                        <span className="brand-logo-text">MOLI-CELL</span>
                    </Link>

                    {/* Menú Central */}
                    <nav className="nav-links-center">
                        <Link to="/" className="nav-link-item">Inicio</Link>
                        
                        {/* Dropdown Categorías del Backend */}
                        <div 
                            className="nav-dropdown-item"
                            onMouseEnter={handleMouseEnterCategories}
                            onMouseLeave={handleMouseLeaveCategories}
                        >
                            <button 
                                type="button"
                                className="nav-link-item dropdown-btn"
                                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                                aria-expanded={isCategoriesDropdownOpen}
                            >
                                <span>Categorías</span>
                                <ChevronDown size={14} className={`dropdown-chevron ${isCategoriesDropdownOpen ? 'open' : ''}`} />
                            </button>

                            {isCategoriesDropdownOpen && (
                                <div className="nav-categories-dropdown-menu">
                                    {categorias && categorias.length > 0 ? (
                                        categorias.map((cat) => {
                                            const catName = cat.name || cat.nombre || 'Categoría';
                                            return (
                                                <button
                                                    key={cat.id || cat.id_categoria || catName}
                                                    type="button"
                                                    className="dropdown-category-link"
                                                    onClick={() => handleCategoryClick(catName)}
                                                >
                                                    {catName}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <>
                                            <button type="button" className="dropdown-category-link" onClick={() => handleCategoryClick('Accesorios')}>Accesorios</button>
                                            <button type="button" className="dropdown-category-link" onClick={() => handleCategoryClick('Auriculares')}>Auriculares</button>
                                            <button type="button" className="dropdown-category-link" onClick={() => handleCategoryClick('Celulares')}>Celulares</button>
                                            <button type="button" className="dropdown-category-link" onClick={() => handleCategoryClick('Repuestos')}>Repuestos</button>
                                            <button type="button" className="dropdown-category-link" onClick={() => handleCategoryClick('Impresiones 3D')}>Impresiones 3D</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <a href="/#ofertas" className="nav-link-item">Ofertas</a>
                        <Link to="/catalogo" className="nav-link-item">Catálogo</Link>
                        <Link to="/servicio-tecnico" className="nav-link-item">Servicio Técnico</Link>
                        <Link to="/contacto" className="nav-link-item">Contacto</Link>
                    </nav>

                    {/* Acciones Derecha (Buscador, Usuario, Carrito) */}
                    <div className="nav-actions-right">
                        
                        {/* Buscador Desplegable Desktop */}
                        <div className="desktop-search-wrapper">
                            {isSearchOpen ? (
                                <form onSubmit={handleSearchSubmit} className="desktop-search-form">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar productos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        className="desktop-search-input"
                                    />
                                    <button type="button" onClick={() => setIsSearchOpen(false)} className="desktop-search-close">
                                        <X size={16} />
                                    </button>
                                </form>
                            ) : (
                                <button 
                                    type="button" 
                                    className="nav-action-icon-btn" 
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label="Buscar"
                                    title="Buscar productos"
                                >
                                    <Search size={20} />
                                </button>
                            )}
                        </div>

                        {/* Botón Usuario / Admin */}
                        <Link 
                            to="/admin/login" 
                            className="nav-action-icon-btn"
                            aria-label="Mi Cuenta / Administración"
                            title="Panel de Administración"
                        >
                            <User size={21} />
                        </Link>

                        {/* Botón Carrito con Badge */}
                        <button 
                            type="button" 
                            className="nav-action-icon-btn cart-btn-wrap" 
                            onClick={onOpenCart}
                            aria-label="Carrito de compras"
                            title="Ver Carrito"
                        >
                            <ShoppingCart size={21} />
                            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
                        </button>

                    </div>

                </div>

                {/* ─── MOBILE NAVBAR ─── */}
                <div className="navbar-mobile-container">
                    
                    <button 
                        type="button" 
                        className="mobile-burger-toggle"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu size={26} />
                    </button>

                    <Link to="/" className="brand-logo-wrap mobile-center-brand">
                        <img src={logoImg} alt="Moli-Cell Logo" className="navbar-brand-logo-img-sm" />
                        <span className="brand-logo-text-sm">MOLI-CELL</span>
                    </Link>

                    <div className="mobile-right-actions">
                        <Link 
                            to="/admin/login" 
                            className="nav-action-icon-btn-sm"
                            aria-label="Admin"
                        >
                            <User size={20} />
                        </Link>
                        <button 
                            type="button" 
                            className="nav-action-icon-btn-sm cart-btn-wrap" 
                            onClick={onOpenCart}
                            aria-label="Carrito"
                        >
                            <ShoppingCart size={20} />
                            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
                        </button>
                    </div>

                </div>

            </div>

            {/* ─── MOBILE DRAWER MENU ─── */}
            {isMenuOpen && (
                <div className="mobile-drawer-overlay" onClick={closeMobileMenu}>
                    <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header del Drawer */}
                        <div className="mobile-drawer-header">
                            <div className="drawer-brand-wrap">
                                <img src={logoImg} alt="Moli-Cell Logo" className="navbar-drawer-logo-img" />
                                <span className="drawer-brand-name">Moli-Cell</span>
                            </div>
                            <button 
                                type="button" 
                                className="mobile-drawer-close-btn"
                                onClick={closeMobileMenu}
                                aria-label="Cerrar menú"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Buscador dentro del Drawer Mobile */}
                        <form onSubmit={handleSearchSubmit} className="mobile-drawer-search-form">
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando?" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mobile-drawer-search-input"
                            />
                            <button type="submit" className="mobile-drawer-search-btn" aria-label="Buscar">
                                <Search size={18} />
                            </button>
                        </form>

                        {/* Lista de Navegación Mobile */}
                        <ul className="mobile-drawer-list">
                            <li className="mobile-drawer-item">
                                <Link to="/" onClick={closeMobileMenu}>INICIO</Link>
                            </li>

                            {/* Categorías con sub-acordeón */}
                            <li className="mobile-drawer-item item-has-dropdown">
                                <button 
                                    type="button"
                                    className="mobile-drawer-dropdown-btn"
                                    onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                                >
                                    <span>CATEGORÍAS</span>
                                    <ChevronRight size={18} className={`chevron-trans ${isMobileCategoriesOpen ? 'rotate-90' : ''}`} />
                                </button>

                                {isMobileCategoriesOpen && (
                                    <div className="mobile-drawer-subcategories">
                                        {categorias && categorias.length > 0 ? (
                                            categorias.map((cat) => {
                                                const catName = cat.name || cat.nombre || 'Categoría';
                                                return (
                                                    <button
                                                        key={cat.id || cat.id_categoria || catName}
                                                        type="button"
                                                        className="mobile-subcat-link"
                                                        onClick={() => handleCategoryClick(catName)}
                                                    >
                                                        {catName}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <>
                                                <button type="button" className="mobile-subcat-link" onClick={() => handleCategoryClick('Accesorios')}>Accesorios</button>
                                                <button type="button" className="mobile-subcat-link" onClick={() => handleCategoryClick('Auriculares')}>Auriculares</button>
                                                <button type="button" className="mobile-subcat-link" onClick={() => handleCategoryClick('Celulares')}>Celulares</button>
                                                <button type="button" className="mobile-subcat-link" onClick={() => handleCategoryClick('Repuestos')}>Repuestos</button>
                                                <button type="button" className="mobile-subcat-link" onClick={() => handleCategoryClick('Impresiones 3D')}>Impresiones 3D</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </li>

                            <li className="mobile-drawer-item">
                                <a href="/#ofertas" onClick={closeMobileMenu}>OFERTAS</a>
                            </li>
                            <li className="mobile-drawer-item">
                                <Link to="/catalogo" onClick={closeMobileMenu}>CATÁLOGO</Link>
                            </li>
                            <li className="mobile-drawer-item">
                                <Link to="/servicio-tecnico" onClick={closeMobileMenu}>SERVICIO TÉCNICO</Link>
                            </li>
                            <li className="mobile-drawer-item">
                                <Link to="/contacto" onClick={closeMobileMenu}>CONTACTO</Link>
                            </li>
                            <li className="mobile-drawer-item">
                                <Link to="/admin/login" onClick={closeMobileMenu}>PANEL ADMIN</Link>
                            </li>
                        </ul>

                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;