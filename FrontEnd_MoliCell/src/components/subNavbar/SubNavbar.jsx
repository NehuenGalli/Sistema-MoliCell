import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import './SubNavbar.css';

const SubNavbar = ({ categorias = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="sub-navbar">
            <div className="sub-navbar-container">
                <ul className="sub-navbar-links">
                    {/* Dropdown de Categorías */}
                    <li 
                        className="dropdown-item"
                        onMouseEnter={() => setIsOpen(true)}
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        <button 
                            className="dropdown-toggle"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-expanded={isOpen}
                        >
                            CATEGORÍAS <ChevronDown size={14} className={`arrow-icon ${isOpen ? 'open' : ''}`} />
                        </button>

                        {/* Menú desplegable */}
                        {isOpen && (
                            <div className="dropdown-menu">
                                {categorias.length > 0 ? (
                                    categorias.map((cat) => (
                                        <a 
                                            key={cat.id_categoria || cat.id} 
                                            href={`#categoria-${cat.id_categoria || cat.id}`}
                                            className="dropdown-link"
                                        >
                                            {cat.nombre}
                                        </a>
                                    ))
                                ) : (
                                    <>
                                        <a href="#accesorios" className="dropdown-link">Accesorios</a>
                                        <a href="#fundas" className="dropdown-link">Fundas & Vidrios</a>
                                        <a href="#cargadores" className="dropdown-link">Cargadores & Cables</a>
                                        <a href="#audio" className="dropdown-link">Audio & Auriculares</a>
                                        <a href="#impresion3d" className="dropdown-link">Impresiones 3D</a>
                                    </>
                                )}
                            </div>
                        )}
                    </li>

                    <li>
                        <Link to="/catalogo">CATÁLOGO</Link>
                    </li>
                    <li>
                        <Link to="/servicio-tecnico">SERVICIO TÉCNICO</Link>
                    </li>
                    <li>
                        <a href="#impresiones-3d">IMPRESIONES 3D</a>
                    </li>
                    <li>
                        <Link to="/contacto">CONTACTO</Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SubNavbar;