import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import './ProductCard.css';

const formatPrice = (amount) => {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ProductCard({ product }) {
  if (!product) return null;

  const id = product.id_producto || product.id;
  const name = product.name || product.nombre || 'Producto Moli-Cell';
  
  // Verificación estricta de descuento
  const hasDiscount = Boolean(
    product.descuento && 
    ((product.descuento_precio && product.descuento_precio < product.precio) || 
     (product.precioOriginal && product.precioOriginal > product.precio))
  );

  const price = hasDiscount && product.descuento_precio ? product.descuento_precio : product.precio;
  const originalPrice = hasDiscount ? (product.precioOriginal || (product.precio > price ? product.precio : null)) : null;
  const discountPct = hasDiscount ? (product.descuentoPorcentaje || (originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null)) : null;

  const image = product.img_url || product.imagen || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80';
  const category = product.categoria || (Array.isArray(product.categorias) && product.categorias.length > 0 ? (typeof product.categorias[0] === 'object' ? product.categorias[0].name : product.categorias[0]) : null) || product.marca || 'Moli-Cell';

  return (
    <article className="store-product-card">
      {/* Badge de Descuento solo si el producto realmente tiene descuento */}
      {hasDiscount && discountPct && discountPct > 0 && (
        <span className="card-badge-discount">-{discountPct}%</span>
      )}

      {/* Imagen del producto (Enlace al detalle) */}
      <Link to={`/producto/${id}`} className="card-img-container">
        <img
          src={image}
          alt={name}
          className="card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80';
          }}
        />
      </Link>

      {/* Información del Producto */}
      <div className="card-info">
        <span className="card-category-tag">{category}</span>

        <h3 className="card-product-title">
          <Link to={`/producto/${id}`} title={name}>
            {name}
          </Link>
        </h3>

        <div className="card-price-block">
          {/* Precio tachado solo si tiene descuento y el precio original es mayor */}
          {hasDiscount && originalPrice && originalPrice > price && (
            <span className="card-price-old">{formatPrice(originalPrice)}</span>
          )}
          <span className="card-price-current">{formatPrice(price)}</span>
        </div>

        {/* Botón Comprar ahora -> redirige a la página del producto específico */}
        <Link to={`/producto/${id}`} className="btn-card-buy">
          <ShoppingCart size={16} />
          <span>Comprar ahora</span>
        </Link>
      </div>
    </article>
  );
}
