import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Tag, ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import './Offers.css';

export default function Offers({ productos = [], onAddToCart }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filtrar ÚNICAMENTE productos que tengan activado el descuento
  const offersList = (productos || []).filter((p) => {
    const isDiscountActive = p.descuento === true || p.descuento === 'true' || p.descuento === 1;
    const hasDiscountPrice = p.descuento_precio && Number(p.descuento_precio) > 0 && Number(p.descuento_precio) < Number(p.precio);
    const hasOriginalPrice = p.precioOriginal && Number(p.precioOriginal) > Number(p.precio);
    return isDiscountActive || hasDiscountPrice || hasOriginalPrice;
  });

  // Mostrar una selección de ofertas en la Home (hasta 8 productos)
  const displayOffers = offersList.slice(0, 8);

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [displayOffers]);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Si no hay ofertas cargadas, no mostramos productos que no tengan descuento
  if (offersList.length === 0) {
    return (
      <section className="offers-section" id="ofertas" aria-labelledby="offers-heading">
        <div className="offers-container">
          <div className="offers-header">
            <h2 id="offers-heading" className="offers-title">
              Ofertas
            </h2>
          </div>
          <div className="offers-empty-state">
            <Tag size={32} className="offers-empty-icon" />
            <p>No hay productos en oferta actualmente. ¡Pronto agregaremos nuevas promociones!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="offers-section" id="ofertas" aria-labelledby="offers-heading">
      <div className="offers-container">
        
        {/* Header de la sección */}
        <div className="offers-header">
          <div className="offers-title-wrap">
            <h2 id="offers-heading" className="offers-title">
              Ofertas
            </h2>
          </div>

          <div className="offers-header-actions">
            <Link to="/catalogo?ofertas=true" className="offers-view-all-link">
              <span>Ver todas las ofertas</span>
              <ArrowRight size={16} />
            </Link>

            {/* Controles de navegación */}
            {displayOffers.length > 3 && (
              <div className="offers-nav-controls">
                <button
                  type="button"
                  className={`offers-nav-btn ${!canScrollLeft ? 'disabled' : ''}`}
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Ver ofertas anteriores"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={`offers-nav-btn ${!canScrollRight ? 'disabled' : ''}`}
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Ver siguientes ofertas"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carrusel / Grid Slider de Ofertas */}
        <div 
          className="offers-track" 
          ref={scrollContainerRef}
        >
          {displayOffers.map((item) => (
            <ProductCard 
              key={item.id || item.id_producto} 
              product={item} 
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
