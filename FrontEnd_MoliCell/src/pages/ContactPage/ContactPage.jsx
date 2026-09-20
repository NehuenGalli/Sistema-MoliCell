import { useState } from 'react';
import './ContactPage.css';
import { Phone, Clock, MapPin } from 'lucide-react';

// ── Datos del negocio ───────────────────────────────────────────────────────
const WHATSAPP_NUMBER = '5491134324675';

const CONTACT_INFO = {
  telefono:  '+54 9 11 3432-4675',
  direccion: 'Blas Parera 3, Quilmes, Buenos Aires',
  horarios: [
    { dias: 'Lunes a Viernes', horario: '10:00 – 14:00 | 15:00 – 19:00' },
    { dias: 'Sábados',         horario: '10:00 – 14:00' },
    { dias: 'Domingos',        horario: 'Cerrado' },
  ],
};

// URL del embed de Google Maps
const MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Blas%20Parera%203%2C%20Quilmes%2C%20Provincia%20de%20Buenos%20Aires&t=&z=16&ie=UTF8&iwloc=&output=embed';

export default function ContactPage() {
  const [form, setForm] = useState({
    nombre:   '',
    apellido: '',
    asunto:   '',
    mensaje:  '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, apellido, asunto, mensaje } = form;
    if (!nombre.trim() || !mensaje.trim()) return;

    const fullName = `${nombre.trim()} ${apellido.trim()}`.trim();
    const text = [
      `Hola! Soy *${fullName}*.`,
      asunto ? `Asunto: *${asunto.trim()}*` : '',
      '',
      mensaje.trim(),
    ].join('\n');

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
    setTimeout(() => {
      setForm({ nombre: '', apellido: '', asunto: '', mensaje: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="cp-page">
      <div className="cp-container">

        {/* ── ZONA SUPERIOR: texto + form ── */}
        <div className="cp-top">

          {/* IZQUIERDA — título y datos */}
          <div className="cp-left">
            <h1 className="cp-title">Contactanos</h1>
            <p className="cp-subtitle">
              ¿Tenés alguna duda sobre un producto, reparación o precio?
              Escribinos y te respondemos a la brevedad.
            </p>

            <ul className="cp-info-list">
              <li className="cp-info-item">
                <Phone size={17} strokeWidth={2} className="cp-info-icon" />
                <a href={`tel:${CONTACT_INFO.telefono.replace(/[\s+-]/g, '')}`} className="cp-info-link">
                  {CONTACT_INFO.telefono}
                </a>
              </li>
              <li className="cp-info-item">
                <MapPin size={17} strokeWidth={2} className="cp-info-icon" />
                <span className="cp-info-text">{CONTACT_INFO.direccion}</span>
              </li>
              <li className="cp-info-item cp-info-item--clock">
                <Clock size={17} strokeWidth={2} className="cp-info-icon" />
                <div className="cp-horarios">
                  {CONTACT_INFO.horarios.map((h) => (
                    <span key={h.dias} className="cp-horario-row">
                      <span className="cp-horario-dias">{h.dias}</span>
                      <span className="cp-horario-val">{h.horario}</span>
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>

          {/* DERECHA — formulario sin borde */}
          <div className="cp-right">
            <div className="cp-form-card">
              <h2 className="cp-form-title">Envianos un mensaje</h2>
              <p className="cp-form-desc">
                Respondemos dentro del día hábil por WhatsApp.
              </p>

              <form className="cp-form" onSubmit={handleSubmit} noValidate>
                <div className="cp-row-2">
                  <div className="cp-field">
                    <label htmlFor="cp-nombre" className="cp-label">
                      Nombre <span className="cp-required">*</span>
                    </label>
                    <input
                      id="cp-nombre"
                      name="nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleChange}
                      className="cp-input"
                      placeholder="María"
                      required
                    />
                  </div>
                  <div className="cp-field">
                    <label htmlFor="cp-apellido" className="cp-label">
                      Apellido
                    </label>
                    <input
                      id="cp-apellido"
                      name="apellido"
                      type="text"
                      value={form.apellido}
                      onChange={handleChange}
                      className="cp-input"
                      placeholder="González"
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label htmlFor="cp-asunto" className="cp-label">
                    Asunto <span className="cp-required">*</span>
                  </label>
                  <input
                    id="cp-asunto"
                    name="asunto"
                    type="text"
                    value={form.asunto}
                    onChange={handleChange}
                    className="cp-input"
                    placeholder="Ej: consulta por reparación de pantalla"
                    required
                  />
                </div>

                <div className="cp-field">
                  <label htmlFor="cp-mensaje" className="cp-label">
                    Mensaje <span className="cp-required">*</span>
                  </label>
                  <textarea
                    id="cp-mensaje"
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    className="cp-textarea"
                    placeholder="Contanos tu consulta con el mayor detalle posible..."
                    rows={5}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`cp-btn-submit ${submitted ? 'cp-btn-sent' : ''}`}
                  disabled={submitted}
                >
                  {submitted ? '¡Abriendo WhatsApp…!' : 'Enviar mensaje por WhatsApp'}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ── MAPA ABAJO — Contenido dentro del contenedor principal en Desktop ── */}
        <div className="cp-map-section">
          <iframe
            title="Ubicación Moli-Cell"
            src={MAPS_EMBED_URL}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </div>
  );
}
