"use client";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import CarouselTile from "@/components/CarouselTile";

const STATIC_ITEMS = [
  {
    src: "/gallery/img1.jpeg",
    alt: "Voluntarios del Banco de Alimentos Durango",
    className: "group relative col-span-2 aspect-video overflow-hidden rounded-2xl md:col-span-1 md:row-span-2 md:aspect-auto",
    overlay: true,
  },
  {
    src: "/gallery/img2.jpeg",
    alt: "Distribución en comunidad",
    className: "group relative aspect-square overflow-hidden rounded-2xl md:aspect-auto",
  },
  {
    src: "/gallery/img3.jpeg",
    alt: "Apoyo al banco de alimentos",
    className: "group relative aspect-square overflow-hidden rounded-2xl md:aspect-auto",
  },
];

const CAROUSEL_IMAGES = [
  { src: "/gallery/img1.jpeg", alt: "Voluntarios" },
  { src: "/gallery/img2.jpeg", alt: "Distribución" },
  { src: "/gallery/img3.jpeg", alt: "Apoyo" },
  { src: "/gallery/img4.jpeg", alt: "Comunidad" },
  { src: "/gallery/img5.jpeg", alt: "Banco de alimentos" },
];

export default function GallerySection() {
  const [headerRef, headerInView] = useInView();
  const [gridRef, gridInView] = useInView();

  return (
    <section className="bg-gray-50 px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          ref={headerRef}
          className="mb-10 flex items-end justify-between gap-4 sm:mb-12"
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? "none" : "translateY(20px)",
            transition: "opacity 0.65s ease-out, transform 0.65s ease-out",
          }}
        >
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
              Galería
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
              Momentos que<br className="hidden sm:block" /> hacen la diferencia
            </h2>
          </div>
          <Link
            href="/galeria"
            className="shrink-0 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
          >
            Ver galería →
          </Link>
        </div>

        {/* ── Photo grid ──────────────────────────────────────────────── */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-3 sm:gap-4 md:h-125 md:grid-cols-3 md:grid-rows-2"
        >
          {/* Static photo tiles */}
          {STATIC_ITEMS.map((item, i) => (
            <div
              key={i}
              className={item.className}
              style={{
                opacity: gridInView ? 1 : 0,
                transform: gridInView ? "none" : "translateY(20px)",
                transition: `opacity 0.6s ease-out ${i * 80}ms, transform 0.6s ease-out ${i * 80}ms`,
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={i === 0}
              />
              {item.overlay && (
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              )}
            </div>
          ))}

          {/* Carousel tile — cycles through all gallery photos */}
          <CarouselTile
            images={CAROUSEL_IMAGES}
            className="aspect-square md:aspect-auto"
            style={{
              opacity: gridInView ? 1 : 0,
              transform: gridInView ? "none" : "translateY(20px)",
              transition: `opacity 0.6s ease-out ${STATIC_ITEMS.length * 80}ms, transform 0.6s ease-out ${STATIC_ITEMS.length * 80}ms`,
            }}
          />

          {/* CTA tile — hover reveals Instagram with gradient */}
          <Link
            href="https://www.instagram.com/badurango"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brand-yellow p-6 md:aspect-auto"
            style={{
              opacity: gridInView ? 1 : 0,
              transform: gridInView ? "none" : "translateY(20px)",
              transition: `opacity 0.6s ease-out ${(STATIC_ITEMS.length + 1) * 80}ms, transform 0.6s ease-out ${(STATIC_ITEMS.length + 1) * 80}ms`,
            }}
          >
            {/* Instagram gradient overlay */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #515bd4 100%)" }}
            />

            {/* Default state — slides up and fades out */}
            <div className="absolute flex flex-col items-center gap-3 text-center transition-all duration-300 ease-out group-hover:-translate-y-6 group-hover:opacity-0">
              <span className="text-5xl font-black leading-none text-[#451703] sm:text-6xl">+</span>
              <span className="text-sm font-bold leading-snug text-[#451703] sm:text-base">
                Ver todas<br />las fotos
              </span>
            </div>

            {/* Instagram state — slides up into view, white text */}
            <div className="absolute z-10 flex translate-y-6 flex-col items-center gap-3 text-center opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                className="h-10 w-10 text-white transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-sm font-bold leading-snug text-white sm:text-base">
                Ver en<br />Instagram
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
