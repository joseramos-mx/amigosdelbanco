import MapaRuta from "./MapaRuta";
import Reveal from "./Reveal";
import { DISTANCIA_KM, LIGA_GOOGLE_MAPS, PROVISIONAL } from "@/lib/run/ruta";

/**
 * Segunda sección de la landing: la ruta.
 *
 * Va debajo del bento y antes del pie. El bento sigue siendo una sola
 * pantalla; esto es lo primero que aparece al bajar.
 */
export default function SeccionRuta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1500px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              El recorrido
            </p>
            <h2 className="mt-3 font-geist tracking-tighter text-[clamp(2.5rem,7vw,5rem)] uppercase leading-[0.85]">
              De la estación
              <br />
              <span className="text-run-amber font-bold tracking-tighter">al banco de alimentos</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div>
              <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                Distancia
              </p>
              <p className="mt-1 font-schabo text-4xl uppercase leading-none">
                {DISTANCIA_KM} km
              </p>
            </div>
            <a
              href={LIGA_GOOGLE_MAPS}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
            >
              Cómo llegar
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <MapaRuta />
        </Reveal>

        {PROVISIONAL && (
          <p className="mt-4 text-xs leading-relaxed text-white/35">
            Trazo preliminar entre salida y meta. El recorrido definitivo por calles
            se publica en cuanto lo cierre la organización — no lo tomes para
            calcular tu ritmo todavía.
          </p>
        )}
      </div>
    </section>
  );
}
