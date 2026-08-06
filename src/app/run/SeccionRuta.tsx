import Image from "next/image";
import MapaRuta from "./MapaRuta";
import Reveal from "./Reveal";
import {
  DESNIVEL_M,
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

/** Guion cuando el dato todavía no lo confirma la organización. */
const SIN_DATO = "—";

export default function SeccionRuta() {
  const datos = [
    { etiqueta: "Distancia", valor: `${DISTANCIA_KM} km` },
    { etiqueta: "Desnivel", valor: DESNIVEL_M === null ? SIN_DATO : `${DESNIVEL_M} m` },
    { etiqueta: "Tiempo", valor: TIEMPO_LIMITE ?? SIN_DATO },
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
                <div className="flex items-end justify-between gap-4">
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

                <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-white/45">
                  Sale de la Antigua Estación de Ferrocarril y termina en el
                  Banco de Alimentos. Recorrido urbano, medido sobre el trazo
                  oficial que entregó la organización.
                </p>
              </div>
            </div>

            {/* ── Columna derecha: mapa ────────────────────────────────── */}
            <div className="h-[420px] lg:h-full">
              <MapaRuta />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
