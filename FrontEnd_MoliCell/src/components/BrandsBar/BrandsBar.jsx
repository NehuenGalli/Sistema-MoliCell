import { Link } from 'react-router-dom';
import './BrandsBar.css';
import marcaTestImg from '../../assets/marca-test.webp';

// Marcas de muestra que repiten la imagen de marca según la solicitud
const BRANDS_LIST = [
  { id: 1, name: 'Samsung', logo: marcaTestImg },
  { id: 2, name: 'Apple', logo: marcaTestImg },
  { id: 3, name: 'Motorola', logo: marcaTestImg },
  { id: 4, name: 'Xiaomi', logo: marcaTestImg },
  { id: 5, name: 'JBL', logo: marcaTestImg },
  { id: 6, name: 'Sony', logo: marcaTestImg },
  { id: 7, name: 'Ditron', logo: marcaTestImg },
  { id: 8, name: 'Aitech', logo: marcaTestImg },
  { id: 9, name: 'Netmak', logo: marcaTestImg },
];

export default function BrandsBar({ brands = BRANDS_LIST }) {
  return (
    <section className="brands-section" id="marcas" aria-label="Nuestras marcas">
      <div className="brands-container">
        
        {/* Título lateral "Nuestras marcas" */}
        <div className="brands-title-wrapper">
          <h2 className="brands-title">Nuestras marcas</h2>
        </div>

        {/* Listado / Carrusel de círculos de marcas */}
        <div className="brands-track">
          {brands.map((brand, index) => (
            <Link 
              key={`${brand.id}-${index}`} 
              to={`/catalogo?marca=${encodeURIComponent(brand.name)}`}
              className="brand-circle-item" 
              title={`Ver productos de ${brand.name}`}
            >
              <div className="brand-circle">
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="brands-item-logo-img"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
