import Image from "next/image";
import Reveal from "./Reveal";

/**
 * Cuarta sección de la landing: lo que trae el Founder Kit.
 *
 * Tres columnas de alto fijo, cada una repartida distinto: a la izquierda el
 * título sobre la playera, en medio el tote de cuerpo entero, y a la derecha
 * la pulsera y el ticket partidos a la mitad. No es una reja pareja, así que
 * va escrita tal cual en vez de salir de un arreglo — con cuatro piezas que
 * no se repiten, un `map` con excepciones cuesta más de leer.
 *
 * La tarjeta de la playera es la única blanca: el mockup es una camiseta
 * negra recortada, y sobre fondo oscuro no se vería.
 */

/** Etiqueta sobre la foto. Las dos piezas grandes la llevan mayor. */
function Etiqueta({ children, grande }: { children: string; grande?: boolean }) {
  return (
    <p
      className={`absolute inset-x-0 text-center font-geist font-bold uppercase leading-none tracking-tight text-white ${
        grande
          ? "bottom-6 text-[clamp(1.6rem,3.1vw,2.9rem)] lg:bottom-8"
          : "bottom-5 text-[clamp(0.95rem,1.5vw,1.35rem)]"
      }`}
    >
      {children}
    </p>
  );
}

const TARJETA = "relative overflow-hidden rounded-[20px]";

export default function SeccionKit() {
  return (
    <section id="kit" className="px-4 pb-16 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <div className="grid gap-3 lg:h-[560px] lg:grid-cols-3 lg:gap-4">
            {/* ── Título + playera ─────────────────────────────────────── */}
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="flex items-center justify-center rounded-[20px] bg-run-card px-6 py-7 lg:h-[112px] lg:py-0">
                <h2 className="font-schabo text-[clamp(2.4rem,5vw,3.6rem)] uppercase leading-none tracking-tight">
                  Founder Kit
                </h2>
              </div>

              <div className={`${TARJETA} h-[300px] bg-white sm:h-[380px] lg:h-auto lg:flex-1`}>
                <Image
                  src="/run/kit/playera.webp"
                  alt="Playera negra con la leyenda Generous is the new revolution al frente y el logo del Banco de Alimentos de Durango abajo"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
                <Etiqueta grande>Playera</Etiqueta>
              </div>
            </div>

            {/* ── Tote bag ─────────────────────────────────────────────── */}
            <div className={`${TARJETA} h-[360px] bg-run-card sm:h-[460px] lg:h-full`}>
              <Image
                src="/run/kit/tote.webp"
                alt="Tote bag blanco con la leyenda Generous is the new revolution, colgado del hombro"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
              <Etiqueta grande>Tote bag</Etiqueta>
            </div>

            {/* ── Pulsera + ticket ─────────────────────────────────────── */}
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className={`${TARJETA} h-[220px] bg-run-card sm:h-[260px] lg:h-auto lg:flex-1`}>
                <Image
                  src="/run/kit/pulsera.webp"
                  alt="Pulsera de silicón ámbar grabada con la leyenda Generous is the new revolution"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
                <Etiqueta>Pulsera</Etiqueta>
              </div>

              {/* El relleno de abajo es mayor a propósito: la etiqueta va
                  encima, y sin ese hueco el ticket se le monta. */}
              <div className={`${TARJETA} flex items-center bg-run-card px-6 pt-7 pb-16 lg:flex-1 lg:px-8`}>
                {/* El ticket va contenido y no recortado: es la pieza con
                    texto, y cortarle una orilla la vuelve ilegible. */}
                <Image
                  src="/run/kit/ticket.webp"
                  alt="Founding Member Pass del Social Run 2026, con el talón de la rifa desprendible"
                  width={1600}
                  height={648}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="h-auto w-full"
                />
                <Etiqueta>Ticket de consumo</Etiqueta>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
