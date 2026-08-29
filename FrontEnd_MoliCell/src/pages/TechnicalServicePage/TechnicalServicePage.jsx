import React, { useState } from 'react';
import { 
  Smartphone, 
  Wrench, 
  ClipboardCheck, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle2,
  AlertCircle,
  Search,
  Send
} from 'lucide-react';
import { tecnicoService } from '../../services';
import './TechnicalServicePage.css';

const WHATSAPP_NUMBER = '5491134324675';

export default function TechnicalServicePage() {
  const [searchCode, setSearchCode] = useState('');
  const [repairResult, setRepairResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    dispositivo: '',
    tipoProblema: '',
    explicacion: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSearchCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = searchCode.trim().toUpperCase();
    if (!cleanCode) return;

    setSearched(true);
    setLoadingSearch(true);
    try {
      const data = await tecnicoService.consultarSeguimiento(cleanCode);
      if (data) {
        setRepairResult({
          codigo: data.codigo_seguimiento || cleanCode,
          cliente: data.cliente_nombre || 'Cliente',
          dispositivo: data.dispositivo || 'Equipo',
          falla: data.falla_descripcion || 'Revisión técnica',
          estado: data.estado || 'En Proceso',
          estadoBadge: (data.estado === 'Listo' || data.estado === 'Entregado') ? 'success' : 'warning',
          fechaIngreso: data.creado_en ? new Date(data.creado_en).toLocaleDateString('es-AR') : 'Reciente',
          costoEstimado: data.presupuesto_estimado ? `$${Number(data.presupuesto_estimado).toLocaleString('es-AR')}` : 'A confirmar',
          detalles: `Estado actual del equipo: ${data.estado}.`
        });
      } else {
        setRepairResult(null);
      }
    } catch (error) {
      console.warn('Error buscando código de seguimiento en backend:', error);
      setRepairResult(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleChangeForm = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitBudget = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.dispositivo.trim() || !form.explicacion.trim()) return;

    const mensaje = [
      `🛠️ *CONSULTA DE SERVICIO TÉCNICO MOLI-CELL*`,
      `👤 *Cliente:* ${form.nombre.trim()}`,
      `📱 *Dispositivo:* ${form.dispositivo.trim()}`,
      `🔧 *Problema:* ${form.tipoProblema || 'No especificado'}`,
      `📝 *Detalle:* ${form.explicacion.trim()}`
    ].join('%0A%0A');

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
    setSubmitted(true);
    setTimeout(() => {
      setForm({ nombre: '', dispositivo: '', tipoProblema: '', explicacion: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="tech-page">
      
      {/* ── 1. HERO CON IMAGEN DE FONDO DE LABORATORIO ── */}
      <header className="tech-hero">
        <div className="tech-hero-overlay"></div>
        <div className="tech-hero-content">
          <span className="tech-hero-badge">
            <span className="badge-highlight">SERVICIO TÉCNICO</span>
          </span>
          <h1 className="tech-hero-title">
            Servicio Técnico<br />Especializado en<br />Celulares
          </h1>
          <p className="tech-hero-subtitle">
            Reparaciones rápidas, repuestos de calidad para todas las marcas<br className="hide-mobile" /> y atención técnica especializada.
          </p>
        </div>
      </header>

      {/* ── 2. TARJETA DE CONSULTA DE ESTADO (OVERLAPPING EL HERO) ── */}
      <div className="tech-container">
        
        <section className="tech-tracking-card-section">
          <div className="tracking-card">
            <h2 className="tracking-card-title">Consultá el estado de tu reparación</h2>
            <p className="tracking-card-subtitle">
              Ingresá el código de orden otorgado al dejar tu equipo en el local.
            </p>

            <form onSubmit={handleSearchCode} className="tracking-card-form">
              <div className="tracking-input-row">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Ej: REP-1042 o MC-8492"
                  className="tracking-input"
                />
                <button type="submit" className="tracking-btn-submit">
                  Consultar
                </button>
              </div>
            </form>

            {/* Resultado de búsqueda exitosa */}
            {searched && !loadingSearch && repairResult && (
              <div className="repair-result-modal">
                <div className="result-header">
                  <div>
                    <span className="result-code-tag">CÓDIGO DE ORDEN</span>
                    <h3 className="result-code">{repairResult.codigo}</h3>
                  </div>
                  <span className={`result-status-badge status-${repairResult.estadoBadge}`}>
                    {repairResult.estadoBadge === 'success' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    {repairResult.estado}
                  </span>
                </div>

                <div className="result-grid">
                  <div>
                    <span className="result-label">Cliente:</span>
                    <strong className="result-value">{repairResult.cliente}</strong>
                  </div>
                  <div>
                    <span className="result-label">Dispositivo:</span>
                    <strong className="result-value">{repairResult.dispositivo}</strong>
                  </div>
                  <div>
                    <span className="result-label">Falla reportada:</span>
                    <strong className="result-value">{repairResult.falla}</strong>
                  </div>
                  <div>
                    <span className="result-label">Presupuesto estimado:</span>
                    <strong className="result-value orange">{repairResult.costoEstimado}</strong>
                  </div>
                </div>

                <div className="result-details">
                  <span className="result-label">Informe técnico:</span>
                  <p>{repairResult.detalles}</p>
                </div>
              </div>
            )}

            {/* Resultado no encontrado */}
            {searched && !loadingSearch && !repairResult && (
              <div className="repair-result-modal error-not-found" style={{ borderLeft: '4px solid #EF4444', backgroundColor: '#FEF2F2', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#991B1B', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>No se encontró ninguna orden con el código ingresado</h3>
                <p style={{ color: '#7F1D1D', margin: 0, fontSize: '0.92rem' }}>
                  Verificá haber escrito el código exactamente como figura en tu comprobante (ej: <strong>MC-1042</strong> o <strong>REP-1042</strong>) o comunicate por WhatsApp con nuestro laboratorio.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── 3. SECCIÓN NUESTROS SERVICIOS (4 COLUMNAS CON DIVISORES) ── */}
        <section className="tech-services-section">
          <div className="services-header">
            <h2>Nuestros servicios</h2>
            <p>Trabajamos con instrumental de laboratorio de precisión y técnicos calificados.</p>
          </div>

          <div className="services-grid-4">
            
            {/* Columna 1 */}
            <div className="service-item">
              <div className="service-icon-box">
                <Smartphone size={32} strokeWidth={1.6} />
              </div>
              <h3>Repuestos</h3>
              <p>
                De todas las marcas y modelos. Pantallas, baterías, módulos, cámaras, placas de carga y más.
              </p>
            </div>

            {/* Columna 2 */}
            <div className="service-item">
              <div className="service-icon-box orange-accent">
                <Wrench size={32} strokeWidth={1.6} />
              </div>
              <h3>Reparación</h3>
              <p>
                Pantallas astilladas, equipos que no encienden, problemas de carga, micrófonos, parlantes y más.
              </p>
            </div>

            {/* Columna 3 */}
            <div className="service-item">
              <div className="service-icon-box">
                <ClipboardCheck size={32} strokeWidth={1.6} />
              </div>
              <h3>Mantenimiento</h3>
              <p>
                Limpieza interna, cambio de pasta térmica, revisión de componentes y optimización de equipos.
              </p>
            </div>

            {/* Columna 4 */}
            <div className="service-item">
              <div className="service-icon-box orange-accent">
                <Clock size={32} strokeWidth={1.6} />
              </div>
              <h3>Servicio rápido</h3>
              <p>
                Reparaciones en el menor tiempo posible. Servicio express en el día para muchos equipos.
              </p>
            </div>

          </div>
        </section>

        {/* ── 4. FORMULARIO Y DATOS DEL LOCAL (2 COLUMNAS) ── */}
        <section className="tech-form-contact-grid">
          
          {/* Izquierda: Formulario */}
          <div className="tech-form-col">
            <h2 className="form-col-title">Solicitá presupuesto o consulta</h2>
            <p className="form-col-subtitle">
              Completá tus datos y te respondemos por WhatsApp.
            </p>

            <form onSubmit={handleSubmitBudget} className="budget-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="nombre">
                    Tu nombre completo <span className="req">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={form.nombre}
                    onChange={handleChangeForm}
                    placeholder="Ej: Martín Gómez"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dispositivo">
                    Marca y modelo del celular <span className="req">*</span>
                  </label>
                  <input
                    id="dispositivo"
                    name="dispositivo"
                    type="text"
                    value={form.dispositivo}
                    onChange={handleChangeForm}
                    placeholder="Ej: iPhone 11 o Moto G24"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tipoProblema">
                  Tipo de problema / Reparación <span className="req">*</span>
                </label>
                <select
                  id="tipoProblema"
                  name="tipoProblema"
                  value={form.tipoProblema}
                  onChange={handleChangeForm}
                  required
                >
                  <option value="" disabled>Seleccioná una opción</option>
                  <option value="Pantalla / Módulo Roto">Pantalla / Módulo Roto</option>
                  <option value="Cambio de Batería">Cambio de Batería</option>
                  <option value="Problemas de Carga / Pin">Problemas de Carga / Pin</option>
                  <option value="Equipo Mojado / No Enciende">Equipo Mojado / No Enciende</option>
                  <option value="Cámara / Micrófono / Audio">Cámara / Micrófono / Audio</option>
                  <option value="Otra Consulta">Otra Consulta</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="explicacion">
                  Explicación del problema <span className="req">*</span>
                </label>
                <textarea
                  id="explicacion"
                  name="explicacion"
                  value={form.explicacion}
                  onChange={handleChangeForm}
                  placeholder="Contanos qué le sucede al equipo (ej: se cayó y quedó la pantalla negra, la batería dura 2 horas, etc.)"
                  rows={4}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn-whatsapp-submit ${submitted ? 'sent' : ''}`}
                disabled={submitted}
              >
                <MessageCircle size={20} />
                <span>{submitted ? '¡Abriendo WhatsApp…!' : 'Enviar consulta por WhatsApp'}</span>
              </button>
            </form>
          </div>

          {/* Derecha: Foto del local + Datos de contacto */}
          <div className="tech-info-col">
            <div className="store-photo-wrap">
              <img
                src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80"
                alt="Local Moli-Cell"
                className="store-photo"
              />
            </div>

            <ul className="store-info-list">
              <li className="store-info-item">
                <MapPin size={22} className="store-icon" />
                <div>
                  <strong>¿Dónde estamos?</strong>
                  <p>Blas Parera 3, Quilmes<br />Buenos Aires, Argentina</p>
                </div>
              </li>

              <li className="store-info-item">
                <Clock size={22} className="store-icon" />
                <div>
                  <strong>Horarios de atención</strong>
                  <p>Lunes a Viernes: 10:00 a 14:00 y 15:00 a 19:00 hs<br />Sábados: 10:00 a 14:00 hs</p>
                </div>
              </li>

              <li className="store-info-item">
                <MessageCircle size={22} className="store-icon" />
                <div>
                  <strong>WhatsApp</strong>
                  <p><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">+54 9 11 3432-4675</a></p>
                </div>
              </li>

              <li className="store-info-item">
                <svg className="store-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <div>
                  <strong>Instagram</strong>
                  <p><a href="https://www.instagram.com/moli.cell?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer">@moli.cell</a></p>
                </div>
              </li>
            </ul>
          </div>

        </section>

      </div>
    </div>
  );
}
