import React from 'react';
import { Percent, Truck } from 'lucide-react';
import heroBannerImg from '../../assets/aaaa.png';
import './Hero.css';

const Hero = () => {
    // Array de mensajes intercalados
    const alternatingItems = [
        { text: '10% de descuento abonando en efectivo', type: 'discount' },
        { text: 'Envío gratis en Bernal y Quilmes', type: 'shipping' },
        { text: '10% de descuento abonando en efectivo', type: 'discount' },
        { text: 'Envío gratis en Bernal y Quilmes', type: 'shipping' },
        { text: '10% de descuento abonando en efectivo', type: 'discount' },
        { text: 'Envío gratis en Bernal y Quilmes', type: 'shipping' },
        { text: '10% de descuento abonando en efectivo', type: 'discount' },
        { text: 'Envío gratis en Bernal y Quilmes', type: 'shipping' },
    ];

    return (
        <section className="hero-banner-section" aria-label="Banner Principal">
            <div className="hero-banner-container">
                
                {/* ── FRANJA SUPERIOR SUPERPUESTA SOBRE LA IMAGEN ── */}
                <div className="hero-marquee-bar hero-marquee-top">
                    <div className="marquee-track">
                        {alternatingItems.map((item, idx) => (
                            <div key={`top-1-${idx}`} className="marquee-item">
                                {item.type === 'discount' ? (
                                    <Percent size={14} className="marquee-icon" />
                                ) : (
                                    <Truck size={15} className="marquee-icon" />
                                )}
                                <span>{item.text}</span>
                                <span className="marquee-separator">•</span>
                            </div>
                        ))}
                        {alternatingItems.map((item, idx) => (
                            <div key={`top-2-${idx}`} className="marquee-item" aria-hidden="true">
                                {item.type === 'discount' ? (
                                    <Percent size={14} className="marquee-icon" />
                                ) : (
                                    <Truck size={15} className="marquee-icon" />
                                )}
                                <span>{item.text}</span>
                                <span className="marquee-separator">•</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── IMAGEN DE BANNER (FULL WIDTH) ── */}
                <div className="hero-banner-image-wrapper">
                    <img
                        src={heroBannerImg}
                        alt="Moli-Cell - Tecnología y Accesorios"
                        className="hero-banner-img"
                        loading="eager"
                    />
                </div>

                {/* ── FRANJA INFERIOR SUPERPUESTA SOBRE LA IMAGEN ── */}
                <div className="hero-marquee-bar hero-marquee-bottom">
                    <div className="marquee-track marquee-track-reverse">
                        {alternatingItems.map((item, idx) => (
                            <div key={`bot-1-${idx}`} className="marquee-item">
                                {item.type === 'shipping' ? (
                                    <Truck size={15} className="marquee-icon" />
                                ) : (
                                    <Percent size={14} className="marquee-icon" />
                                )}
                                <span>{item.text}</span>
                                <span className="marquee-separator">•</span>
                            </div>
                        ))}
                        {alternatingItems.map((item, idx) => (
                            <div key={`bot-2-${idx}`} className="marquee-item" aria-hidden="true">
                                {item.type === 'shipping' ? (
                                    <Truck size={15} className="marquee-icon" />
                                ) : (
                                    <Percent size={14} className="marquee-icon" />
                                )}
                                <span>{item.text}</span>
                                <span className="marquee-separator">•</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
