import Image from "next/image";
import Reveal from "./Reveal";
import { MOODS } from "@/lib/run/moods";

/**
 * Tercera sección de la landing: los moods del festival.
 *
 * Una fila por género, alternando de lado: foto grande con el letrero a la
 * derecha, y junto a ella una tarjeta clara con la descripción. La alternancia
 * se hace con `order` en pantalla grande; al apilarse en celular vuelve al
 * orden del documento, que es el que se lee bien — primero la foto, luego el
 * texto que la explica.
 *
 * Las fotos vienen verticales y la fila es muy horizontal, así que se recortan
 * bastante. `object-cover` centrado funciona porque en las cuatro lo que
 * importa está a media altura.
 */
export default function SeccionMoods() {
  return (
    <section id="moods" className="px-4 pb-16 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-[1500px]">
        
        <div className="space-y-3 lg:space-y-4">
          {MOODS.map((mood, i) => {
            const invertida = i % 2 === 1;
            return (
              <Reveal key={mood.slug} delay={i * 80}>
                {/* No basta con cambiar el `order` para alternar: eso mueve la
                    foto a la segunda columna, que siempre es la angosta, y la
                    foto acaba chiquita con el texto ocupando el hueco grande.
                    Hay que voltear también la plantilla de la reja. */}
                <div
                  className={`grid gap-3 lg:h-[310px] lg:gap-4 ${
                    invertida
                      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,2.14fr)]"
                      : "lg:grid-cols-[minmax(0,2.14fr)_minmax(0,1fr)]"
                  }`}
                >
                  {/* ── Foto con el letrero ─────────────────────────────── */}
                  <div
                    className={`relative h-[220px] overflow-hidden rounded-[20px] sm:h-[280px] lg:h-full ${
                      invertida ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={`/run/moods/${mood.slug}.jpg`}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-end px-5 lg:px-8">
                      {/* Los letreros son dibujos con su propio color, no
                          texto: van como <img> porque el optimizador de
                          imágenes no toca SVG sin habilitarlo a la mala. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/run/moods/${mood.slug}.svg`}
                        alt={mood.nombre}
                        style={{ width: mood.ancho }}
                        className="h-auto"
                      />
                    </div>

                    {mood.playlist && (
                      <a
                        href={mood.playlist}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escuchar una muestra de ${mood.nombre}`}
                        className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 lg:bottom-5 lg:left-5 lg:h-20 lg:w-20"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="ml-1 h-5 w-5 fill-black lg:h-7 lg:w-7"
                          aria-hidden
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* ── Tarjeta con la descripción ──────────────────────── */}
                  <div
                    className={`flex flex-col justify-center rounded-[20px] bg-[#c9c9c9] px-7 py-7 lg:px-12 ${
                      invertida ? "lg:order-1" : ""
                    }`}
                  >
                    <div className="font-bold text-xl uppercase text-neutral-800">Elige tu mood {mood.nombre}:</div>
                    <p className="text-[17px] leading-relaxed text-neutral-800">
                      {mood.descripcion}
                    </p>
                    {mood.artistas.length > 0 && (
                      <p className="mt-4 text-[17px] leading-relaxed text-neutral-600">
                        Si te gusta{" "}
                        <span className="font-medium text-neutral-900">
                          {mood.artistas.join(", ")}
                        </span>
                        , es aquí.
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
