import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import { DEFAULT_FEATURED_PRODUCTS } from '../../data/mockProducts';
import './FeaturedProducts.css';

export default function FeaturedProducts({ productos = [], onAddToCart }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const featuredList = useMemo(() => {
    if (!productos || productos.length === 0) return DEFAULT_FEATURED_PRODUCTS;
    const directDestacados = productos.filter(p => p.destacado || p.es_destacado);
    const conDescuento = productos.filter(p => p.descuento && !p.destacado && !p.es_destacado);
    const combined = [...directDestacados, ...conDescuento];
    return combined.length > 0 ? combined : productos.slice(0, 8);
  }, [productos]);

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
  }, [featuredList]);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="featured-section" id="destacados" aria-labelledby="featured-heading">
      <div className="featured-container">
        
        {/* Header de la sección */}
        <div className="featured-header">
          <h2 id="featured-heading" className="featured-title">
            Productos Destacados
          </h2>

          {/* Controles de navegación */}
          <div className="featured-nav-controls">
            <button
              type="button"
              className={`featured-nav-btn ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Ver destacados anteriores"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={`featured-nav-btn ${!canScrollRight ? 'disabled' : ''}`}
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Ver siguientes destacados"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carrusel / Grid Slider */}
        <div 
          className="featured-track" 
          ref={scrollContainerRef}
        >
          {featuredList.map((item) => (
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
