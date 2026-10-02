import Image from "next/image";
import MapaRuta from "./MapaRuta";
import Reveal from "./Reveal";
import {
  DISTANCIA_KM,
  LIGA_GOOGLE_MAPS,
  TIEMPO_LIMITE,
} from "@/lib/run/ruta";

/**
 * Segunda sección de la landing: la ruta.
 *
 * Va debajo del bento y antes del pie. El bento sigue siendo una sola
 * pantalla; esto es lo primero que aparece al bajar.
 *
 * En pantalla grande son dos columnas de alto fijo: a la izquierda la foto de
 * la salida sobre la ficha de datos, a la derecha el mapa completo. El alto
 * lo fija la reja y la foto se estira con `flex-1`, así que la ficha puede
 * crecer —si algún día el párrafo lleva una línea más— sin desalinear el
 * mapa. En celular se apila y cada bloque toma su propio alto.
 */

export default function SeccionRuta() {
  const datos = [
    { etiqueta: "Distancia", valor: DISTANCIA_KM },
    { etiqueta: "Tiempo", valor: TIEMPO_LIMITE ?? "2h" },
  ];

  return (
    <section id="ruta" className="px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <div className="grid gap-x-7 gap-y-3 lg:h-[760px] lg:grid-cols-[minmax(0,1.24fr)_minmax(0,1fr)]">
            {/* ── Columna izquierda: foto + ficha ──────────────────────── */}
            <div className="flex flex-col gap-3">
              <div className="relative h-[260px] overflow-hidden rounded-[14px] sm:h-[340px] lg:h-auto lg:flex-1">
                <Image
                  src="/run/reloj.jpg"
                  alt="Reloj y vitral de la fachada de la Antigua Estación de Ferrocarril de Durango, punto de salida"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  // El original es vertical y el hueco es horizontal, así que
                  // sobra alto y hay que decidir qué se recorta. Centrado a
                  // secas deja el reloj pegado al borde de arriba; subiendo el
                  // encuadre queda a media altura, con la cornisa y el toldo.
                  className="object-cover object-[center_28%]"
                />
              </div>

              <div className="rounded-[14px] bg-run-card px-8 py-7 sm:px-10">
                <div className="flex items-end justify-around gap-6">
                  {datos.map((dato) => (
                    <div key={dato.etiqueta} className="text-center">
                      <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                        {dato.etiqueta}
                      </p>
                      <p className="mt-2 font-geist text-[clamp(1.75rem,3vw,2.75rem)] font-bold uppercase leading-none tracking-tight">
                        {dato.valor}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 h-px bg-white/10" />

                <a
                  href={LIGA_GOOGLE_MAPS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block rounded-md bg-run-amber px-12 py-2 font-geist-mono text-[11px] uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-85"
                >
                  Cómo llegar
                </a>

                <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-white/60">
                  Inicia y termina donde mismo, Av. Gómez Morín.
                </p>
              </div>
            </div>

            {/* ── Columna derecha: mapa ────────────────────────────────── */}
            <div className="h-[420px] lg:h-full">
              <MapaRuta />
            </div>
          </div>

          {/* ── Itinerario y dinámica del circuito ───────────────────── */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-[14px] bg-run-card p-5 sm:flex-col sm:items-start sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-run-amber/15 text-run-amber">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="font-geist text-xl font-bold uppercase tracking-tight text-white">5:00 PM</p>
                <p className="mt-1 font-geist-mono text-xs uppercase tracking-wider text-run-amber">
                  Antigua Estación de Ferrocarril
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[14px] bg-run-card p-5 sm:flex-col sm:items-start sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-run-amber/15 text-run-amber">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
              <div>
                <p className="font-geist text-xl font-bold uppercase tracking-tight text-white">6:00 PM</p>
                <p className="mt-1 text-xs text-white/70">
                  Corremos juntos a ritmo moderado acompañados de música
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[14px] bg-run-card p-5 sm:flex-col sm:items-start sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-run-amber/15 text-run-amber">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div>
                <p className="font-geist text-xl font-bold uppercase tracking-tight text-white">Circuito</p>
                <p className="mt-1 text-xs text-white/70">
                  3 km y 6 km sobre Boulevard Felipe Pescador y Av. Gómez Morín
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
