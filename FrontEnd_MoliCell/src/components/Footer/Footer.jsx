import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import logoImg from '../../assets/downloadgram.org_658663834_18073324010265668_3678219278523067320_n.jpg';
import './Footer.css';

const WHATSAPP_NUMBER = '5491134324675';

export default function Footer({ categorias = [] }) {
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Moli-Cell!%20Tengo%20una%20consulta.`, '_blank');
  };

  const handleSectionClick = (e, sectionId) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        const navbarOffset = 85;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
        window.scrollTo({
          top: offsetPosition >= 0 ? offsetPosition : 0,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <footer className="footer-site">
      
      {/* ─── EFECTO WATERMARK GIGANTE (MOLI CELL) ─── */}
      <div className="footer-watermark-wrap" aria-hidden="true">
        <span className="footer-watermark-text">MOLI CELL</span>
      </div>

      {/* ─── CONTENIDO PRINCIPAL EN COLUMNAS ─── */}
      <div className="footer-main-content">
        <div className="footer-container">
          
          {/* Columna 1: Marca & Redes */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-logo-link">
              <img src={logoImg} alt="Moli-Cell Logo" className="footer-logo-img" />
              <span className="footer-brand-name">MOLI CELL</span>
            </Link>
            <p className="footer-brand-desc">
              Tecnología de vanguardia, accesorios premium, impresiones 3D y servicio técnico especializado para tus dispositivos.
            </p>
            
            <div className="footer-social-links">
              <button 
                type="button" 
                onClick={handleWhatsAppClick} 
                className="social-btn whatsapp" 
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <MessageCircle size={18} />
              </button>

              <a 
                href="https://www.instagram.com/moli.cell?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn instagram" 
                aria-label="Instagram"
                title="Instagram"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn facebook" 
                aria-label="Facebook"
                title="Facebook"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>

              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn tiktok" 
                aria-label="TikTok"
                title="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.34-6.32V8.46a8.28 8.28 0 0 0 4.84 1.55v-3.32a4.85 4.85 0 0 1-.94 0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Categorías Dinámicas */}
          <div className="footer-col">
            <h3 className="footer-col-title">Categorías</h3>
            <ul className="footer-links-list">
              {categorias && categorias.length > 0 ? (
                categorias.slice(0, 5).map((cat) => {
                  const catName = cat.name || cat.nombre || 'Categoría';
                  return (
                    <li key={cat.id || cat.id_categoria || catName}>
                      <Link to={`/catalogo?categoria=${encodeURIComponent(catName)}`}>
                        {catName}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <>
                  <li><Link to="/catalogo?categoria=Accesorios">Accesorios</Link></li>
                  <li><Link to="/catalogo?categoria=Auriculares">Auriculares</Link></li>
                  <li><Link to="/catalogo?categoria=Celulares">Celulares</Link></li>
                  <li><Link to="/catalogo?categoria=Repuestos">Repuestos</Link></li>
                  <li><Link to="/catalogo?categoria=Impresiones%203D">Impresiones 3D</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Columna 3: Tienda / Shop */}
          <div className="footer-col">
            <h3 className="footer-col-title">Tienda</h3>
            <ul className="footer-links-list">
              <li><Link to="/catalogo">Catálogo Completo</Link></li>
              <li><a href="/#ofertas" onClick={(e) => handleSectionClick(e, 'ofertas')}>Ofertas y Descuentos</a></li>
              <li><a href="/#destacados" onClick={(e) => handleSectionClick(e, 'destacados')}>Productos Destacados</a></li>
              <li><Link to="/catalogo">Novedades</Link></li>
              <li><a href="/#marcas" onClick={(e) => handleSectionClick(e, 'marcas')}>Nuestras Marcas</a></li>
            </ul>
          </div>

          {/* Columna 4: Empresa / Info */}
          <div className="footer-col">
            <h3 className="footer-col-title">Empresa</h3>
            <ul className="footer-links-list">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/servicio-tecnico">Servicio Técnico</Link></li>
              <li><Link to="/contacto">Contacto & Ubicación</Link></li>
              <li><Link to="/admin/login">Acceso Clientes / Admin</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* ─── BARRA INFERIOR DE COPYRIGHT Y TARJETAS ─── */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p className="copyright-text">
            Copyright © Moli-Cell {new Date().getFullYear()}. All Rights Reserved.
          </p>

          {/* Badges de Medios de Pago */}
          <div className="payment-badges-list">
            <span className="pay-badge visa-badge">VISA</span>
            <span className="pay-badge master-badge">
              <span className="circle circle-red"></span>
              <span className="circle circle-yellow"></span>
            </span>
            <span className="pay-badge mp-badge">Mercado Pago</span>
            <span className="pay-badge apple-badge"> Pay</span>
            <span className="pay-badge cash-badge">Efectivo</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
