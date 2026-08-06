"use client";

import Link from "next/link";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

/**
 * Barra fija al pie de la pantalla, solo para la portada del Social Run.
 *
 * Va abajo y no arriba porque su trabajo principal no es navegar —la página
 * son tres secciones— sino tener el botón de comprar siempre a la mano, y en
 * celular el pulgar vive en la mitad de abajo.
 *
 * En pantallas angostas se queda nada más la marca y el botón. Meter también
 * los enlaces no cabe: dos logos, cuatro enlaces y el botón suman más ancho
 * del que tiene un teléfono, y lo que se sacrifica primero es lo que se puede
 * hacer con el dedo de todos modos.
 *
 * El corte está en 768 y no en 640 porque a 640 la cuenta salía por dos
 * píxeles: cabía, pero a costa de comprimir la marca, y los logos se
 * deformaban en vez de recortarse.
 */

const SECCIONES = [
  { id: "inicio", etiqueta: "Inicio" },
  { id: "ruta", etiqueta: "Ruta" },
  { id: "moods", etiqueta: "Moods" },
  { id: "kit", etiqueta: "Kit" },
] as const;

export default function RunNav({ ticketsHref }: { ticketsHref: string }) {
  const [activa, setActiva] = useState<string>(SECCIONES[0].id);
  const lenis = useLenis();

  useEffect(() => {
    const nodos = SECCIONES.map(({ id }) => document.getElementById(id)).filter(
      (n): n is HTMLElement => n !== null,
    );
    if (nodos.length === 0) return;

    // Gana la sección con más superficie a la vista. El observador solo
    // avisa de las que cruzaron un umbral, no de todas, así que hay que
    // llevar la cuenta aparte: si no, al salir una sección la que se queda
    // no reporta nada y el punto se atora en la anterior.
    const superficie = new Map<string, number>();

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          superficie.set(
            entrada.target.id,
            entrada.isIntersecting ? entrada.intersectionRatio : 0,
          );
        }
        let mejor = "";
        let mayor = 0;
        for (const [id, area] of superficie) {
          if (area > mayor) {
            mayor = area;
            mejor = id;
          }
        }
        if (mejor) setActiva(mejor);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const nodo of nodos) observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // Lenis se adueña del scroll, así que un href="#algo" a secas da un brinco
  // seco en lugar del desplazamiento suave del resto de la página.
  const irA = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const destino = document.getElementById(id);
    if (!lenis || !destino) return;
    e.preventDefault();
    lenis.scrollTo(destino, { offset: -24 });
  };

  return (
    <nav
      aria-label="Secciones del Social Run"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-5"
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[#141414]/85 p-2 backdrop-blur-md">
        {/* ── Marca ────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3 pl-2 sm:gap-4 sm:pl-3">
          <Link href="/" aria-label="Banco de Alimentos de Durango">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Banco de Alimentos de Durango"
              className="h-6 w-auto shrink-0 transition-opacity hover:opacity-70 sm:h-7"
            />
          </Link>



          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/run/gglogo.svg"
            alt="Generous Generation"
            className="h-6 w-auto shrink-0 sm:h-7"
          />
          <span className="hidden font-geist font-black text-[24px] uppercase tracking-tightest text-white/70 lg:inline">
            Social Run <span className="font-light">5KM</span>
          </span>
        </div>

        {/* ── Enlaces ──────────────────────────────────────────────── */}
        <ul className="hidden items-center gap-1 md:flex">
          {SECCIONES.map((seccion) => {
            const activo = activa === seccion.id;
            return (
              <li key={seccion.id}>
                <a
                  href={`#${seccion.id}`}
                  onClick={(e) => irA(e, seccion.id)}
                  aria-current={activo ? "true" : undefined}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-5 py-2.5 transition-colors ${
                    activo
                      ? "bg-[#ece8e0] text-black"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      activo ? "bg-black" : "bg-white/35"
                    }`}
                  />
                  <span className="font-geist-mono text-[10px] uppercase tracking-[0.16em]">
                    {seccion.etiqueta}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* ── Comprar ──────────────────────────────────────────────── */}
        <Link
          href={ticketsHref}
          className="shrink-0 rounded-xl bg-run-amber px-5 py-3 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-85 sm:px-7"
        >
          Comprar<span className="hidden md:inline"> boleto</span>
        </Link>
      </div>
    </nav>
  );
}
