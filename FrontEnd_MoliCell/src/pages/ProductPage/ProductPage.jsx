import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  MessageCircle, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Check, 
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import { productoService } from '../../services';
import './ProductPage.css';

const WHATSAPP_NUMBER = '5491134324675';

const formatPrice = (amount) => {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ProductPage({ productos = [], onAddToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);

  // Scroll arriba y cargar producto desde el backend por ID
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCantidad(1);
    setAdded(false);

    const loadProduct = async () => {
      setLoading(true);
      // Buscar primero en el array de props
      const foundInProps = productos.find(p => String(p.id || p.id_producto) === String(id));
      if (foundInProps) {
        setProduct(foundInProps);
        setSelectedImage(foundInProps.img_url || (Array.isArray(foundInProps.imagenes) && foundInProps.imagenes[0]) || null);
        setLoading(false);
      } else {
        try {
          const fetched = await productoService.obtenerProductoPorId(id);
          setProduct(fetched);
          setSelectedImage(fetched?.img_url || (Array.isArray(fetched?.imagenes) && fetched.imagenes[0]) || null);
        } catch (err) {
          console.error('Error al cargar el producto:', err);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProduct();
  }, [id, productos]);

  if (loading) {
    return (
      <div className="product-not-found-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Cargando detalle del producto...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found-container">
        <h2>Producto no encontrado</h2>
        <p>El producto que estás buscando no está disponible o ha sido removido.</p>
        <Link to="/" className="btn-back-home">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Verificación estricta de descuento
  const hasDiscount = Boolean(
    product.descuento && 
    ((product.descuento_precio && product.descuento_precio < product.precio) || 
     (product.precioOriginal && product.precioOriginal > product.precio))
  );

  const currentPrice = hasDiscount && product.descuento_precio 
    ? product.descuento_precio 
    : product.precio;
  const originalPrice = hasDiscount ? (product.precioOriginal || (product.precio > currentPrice ? product.precio : null)) : null;
  const discountPct = hasDiscount ? (product.descuentoPorcentaje || (originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : null)) : null;
  
  const imagenesList = Array.isArray(product.imagenes) && product.imagenes.length > 0
    ? product.imagenes
    : (product.img_url ? [product.img_url] : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80']);

  const mainImage = selectedImage || imagenesList[0];
  const category = product.categoria || (Array.isArray(product.categorias) && product.categorias.length > 0 ? (typeof product.categorias[0] === 'object' ? product.categorias[0].name : product.categorias[0]) : null) || product.marca || 'General';

  // Productos relacionados (excluye el producto actual)
  const relatedProducts = (productos || [])
    .filter((p) => String(p.id_producto || p.id) !== String(id))
    .slice(0, 4);

  const availableStock = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 99;

  const handleQuantityChange = (delta) => {
    setCantidad((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (availableStock > 0 && next > availableStock) return availableStock;
      return next;
    });
  };

  const handleAddToCartClick = () => {
    if (availableStock <= 0) return;
    if (onAddToCart) {
      onAddToCart({
        id: product.id_producto || product.id,
        nombre: product.name || product.nombre,
        precio: currentPrice,
        imagen: mainImage,
        cantidad: cantidad,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWhatsAppConsult = () => {
    const text = `Hola Moli-Cell! Me interesa el producto *${product.name || product.nombre}* (${formatPrice(currentPrice)}). ¿Tienen stock disponible?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="product-page">
      <div className="product-page-container">
        
        {/* Breadcrumb */}
        <nav className="product-breadcrumb">
          <Link to="/">Inicio</Link>
          <ChevronRight size={14} />
          <Link to={`/catalogo?categoria=${encodeURIComponent(category)}`}>{category}</Link>
          <ChevronRight size={14} />
          <span className="active">{product.name || product.nombre}</span>
        </nav>

        {/* Grid de Detalle del Producto */}
        <div className="product-detail-grid">
          
          {/* Columna Izquierda: Fotos / Galería */}
          <div className="product-media-column">
            <div className="product-main-image-wrap">
              {hasDiscount && discountPct && discountPct > 0 && (
                <span className="product-page-discount">-{discountPct}% OFF</span>
              )}
              <img
                src={mainImage}
                alt={product.name || product.nombre}
                className="product-main-image"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80';
                }}
              />
            </div>

            {/* Galería de miniaturas */}
            {imagenesList.length > 1 && (
              <div className="product-thumbnails-row" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {imagenesList.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: mainImage === img ? '2px solid #2563eb' : '2px solid transparent'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Información y Acciones */}
          <div className="product-info-column">
            <div className="product-header-tags">
              <span className="product-category-pill">{category}</span>
              {availableStock > 0 ? (
                <span className="product-stock-badge">
                  <span className="stock-dot"></span> En Stock ({availableStock} disponibles)
                </span>
              ) : (
                <span className="product-stock-badge out-of-stock" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                  <span className="stock-dot" style={{ backgroundColor: '#DC2626' }}></span> Sin Stock Disponible
                </span>
              )}
            </div>

            <h1 className="product-title-main">{product.name || product.nombre}</h1>

            {/* Precios */}
            <div className="product-price-section">
              <div className="product-price-row">
                {hasDiscount && originalPrice && originalPrice > currentPrice && (
                  <span className="product-price-original">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="product-price-main">
                  {formatPrice(currentPrice)}
                </span>
              </div>

              <div className="product-payment-highlights">
                <div className="payment-chip">
                  <CreditCard size={15} />
                  <span>Hasta 6 cuotas sin interés</span>
                </div>
                <div className="payment-chip highlight">
                  <span>10% OFF abonando en efectivo / transferencia</span>
                </div>
              </div>
            </div>

            {/* Descripción breve */}
            {product.descripcion && (
              <div className="product-description-block">
                <p>{product.descripcion}</p>
              </div>
            )}

            {/* Especificaciones destacadas */}
            {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
              <div className="product-specs-box">
                <h3 className="specs-title">Especificaciones clave</h3>
                <ul className="specs-list">
                  {Object.entries(product.especificaciones).map(([key, val]) => (
                    <li key={key} className="spec-item">
                      <span className="spec-key">{key}:</span>
                      <span className="spec-val">{val}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selector de cantidad y botones */}
            <div className="product-actions-block">
              <div className="quantity-selector-wrap">
                <span className="quantity-label">Cantidad:</span>
                <div className="quantity-controls">
                  <button 
                    type="button" 
                    onClick={() => handleQuantityChange(-1)}
                    disabled={cantidad <= 1}
                    aria-label="Restar cantidad"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-num">{cantidad}</span>
                  <button 
                    type="button" 
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Sumar cantidad"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="buttons-group">
                <button
                  type="button"
                  className={`btn-add-cart ${added ? 'added' : ''}`}
                  onClick={handleAddToCartClick}
                  disabled={availableStock <= 0}
                  style={availableStock <= 0 ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#94A3B8' } : {}}
                >
                  {availableStock <= 0 ? (
                    <span>Sin Stock Disponible</span>
                  ) : added ? (
                    <>
                      <Check size={18} />
                      <span>¡Agregado al carrito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Agregar al Carrito</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-whatsapp-buy"
                  onClick={handleWhatsAppConsult}
                >
                  <MessageCircle size={18} />
                  <span>Consultar por WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Badges de confianza */}
            <div className="product-trust-features">
              <div className="trust-item">
                <Truck size={20} className="trust-icon" />
                <div>
                  <h4>Envío a todo el país</h4>
                  <p>Despachamos en 24 horas o retirá en nuestro local gratis.</p>
                </div>
              </div>
              <div className="trust-item">
                <ShieldCheck size={20} className="trust-icon" />
                <div>
                  <h4>Garantía Oficial Moli-Cell</h4>
                  <p>Producto verificado con respaldo técnico oficial.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Sección de Productos Relacionados */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <div className="related-section-header">
              <h2>Productos Relacionados</h2>
              <p>Otras opciones similares que podrían interesarte</p>
            </div>

            <div className="related-products-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard 
                  key={relProduct.id_producto || relProduct.id} 
                  product={relProduct} 
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
