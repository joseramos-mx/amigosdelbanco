"use client";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";

const GRID_ITEMS = [
  {
    src: "/imagen1.png",
    alt: "Voluntarios preparando alimentos",
    className: "group relative col-span-2 aspect-video overflow-hidden rounded-2xl md:col-span-1 md:row-span-2 md:aspect-auto",
    overlay: true,
  },
  {
    src: "/imagen2.png",
    alt: "Distribución en comunidad",
    className: "group relative aspect-square overflow-hidden rounded-2xl md:aspect-auto",
    overlay: false,
  },
  {
    src: "/imagen3.png",
    alt: "Banco de alimentos Durango",
    className: "group relative aspect-square overflow-hidden rounded-2xl md:aspect-auto",
    overlay: false,
  },
  {
    src: "/imagen1.png",
    alt: "Voluntarios en acción",
    className: "group relative aspect-square overflow-hidden rounded-2xl md:aspect-auto",
    overlay: false,
  },
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
          {GRID_ITEMS.map((item, i) => (
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

          {/* CTA tile */}
          <Link
            href="/galeria"
            className="flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-yellow p-6 text-center transition-opacity hover:opacity-90 md:aspect-auto"
            style={{
              opacity: gridInView ? 1 : 0,
              transform: gridInView ? "none" : "translateY(20px)",
              transition: `opacity 0.6s ease-out ${GRID_ITEMS.length * 80}ms, transform 0.6s ease-out ${GRID_ITEMS.length * 80}ms`,
            }}
          >
            <span className="text-5xl font-black leading-none text-[#451703] sm:text-6xl">+</span>
            <span className="text-sm font-bold leading-snug text-[#451703] sm:text-base">
              Ver todas<br />las fotos
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
