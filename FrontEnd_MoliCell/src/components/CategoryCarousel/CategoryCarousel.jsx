import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./CategoryCarousel.css";

import acesoriosImg from "../../assets/acesorios.png";
import auricularesImg from "../../assets/auriculares.png";
import celularesImg from "../../assets/celulares.png";
import repuestosImg from "../../assets/repuestos.png";
import impresiones3dImg from "../../assets/impresiones 3D.png";

const categories = [
  { id: 1, name: "Accesorios", image: acesoriosImg, link: "/catalogo?categoria=Accesorios" },
  { id: 2, name: "Auriculares", image: auricularesImg, link: "/catalogo?categoria=Auriculares" },
  { id: 3, name: "Celulares", image: celularesImg, link: "/catalogo?categoria=Celulares" },
  { id: 4, name: "Repuestos", image: repuestosImg, link: "/catalogo?categoria=Repuestos" },
  { id: 5, name: "Impresiones 3D", image: impresiones3dImg, link: "/catalogo?categoria=Impresiones%203D" },
];

export default function CategoryCarousel() {
  const trackRef = useRef(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = () => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const scrollLeft = track.scrollLeft;

    setShowLeft(scrollLeft > 2);
    setShowRight(scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateArrows();

    const handleScroll = () => updateArrows();
    const handleResize = () => updateArrows();

    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => updateArrows());
    observer.observe(track);

    const images = track.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", updateArrows);
      }
    });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      images.forEach((img) => {
        img.removeEventListener("load", updateArrows);
      });
    };
  }, []);

  const getNextCard = () => {
    const track = trackRef.current;
    if (!track) return null;

    const items = Array.from(track.querySelectorAll(".category-card"));
    const current = track.scrollLeft;

    return items.find((item) => item.offsetLeft > current + 5) || null;
  };

  const getPreviousCard = () => {
    const track = trackRef.current;
    if (!track) return null;

    const items = Array.from(track.querySelectorAll(".category-card"));
    const current = track.scrollLeft;
    const previous = items.filter((item) => item.offsetLeft < current - 5);

    return previous[previous.length - 1] || null;
  };

  const moveNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = getNextCard();
    if (!next) return;

    track.scrollTo({
      left: next.offsetLeft,
      behavior: "smooth",
    });
  };

  const movePrevious = () => {
    const track = trackRef.current;
    if (!track) return;

    const previous = getPreviousCard();
    if (!previous) {
      track.scrollTo({
        left: 0,
        behavior: "smooth",
      });
      return;
    }

    track.scrollTo({
      left: previous.offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <section className="category-carousel-section">
      <div className="category-carousel-wrapper">
        {/* Flecha Izquierda */}
        <button
          type="button"
          className={`carousel-arrow carousel-arrow-left ${!showLeft ? "carousel-arrow-hidden" : ""}`}
          onClick={movePrevious}
          aria-label="Categoría anterior"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Pista del carrusel */}
        <div ref={trackRef} className="category-carousel-track">
          {categories.map((cat) => (
            <Link key={cat.id} to={cat.link} className="category-card">
              <div className="category-image-container">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="category-card-img"
                  draggable="false"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Flecha Derecha */}
        <button
          type="button"
          className={`carousel-arrow carousel-arrow-right ${!showRight ? "carousel-arrow-hidden" : ""}`}
          onClick={moveNext}
          aria-label="Siguiente categoría"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}