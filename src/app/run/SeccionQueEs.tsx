import Image from "next/image";
import Reveal from "./Reveal";

/**
 * Qué es el Social Run.
 *
 * Va pegada al bento, antes de la ruta: es lo primero que se lee al bajar y
 * responde la pregunta que trae quien acaba de llegar a la página. Foto a la
 * izquierda, explicación en ámbar a la derecha.
 */
export default function SeccionQueEs() {
  return (
    <section id="quees" className="px-4 pb-16 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <div className="grid gap-3 lg:h-[500px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.69fr)]">
            <div className="relative h-[320px] overflow-hidden rounded-[20px] bg-white sm:h-[420px] lg:h-full">
              <Image
                src="/run/quees.webp"
                alt="Corredora estirando el cuádriceps antes de salir"
                fill
                sizes="(max-width: 1024px) 100vw, 37vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center rounded-[20px] bg-run-amber px-7 py-10 sm:px-10 lg:px-16">
              <h2 className="font-geist text-[clamp(2.1rem,4.6vw,4.4rem)] font-bold uppercase leading-none tracking-tight text-black/85">
                Social Run 5K
              </h2>

              <div className="mt-7 max-w-[62ch] space-y-4 text-[16px] leading-relaxed text-black/70">
                <p>
                  El Social Run es una carrera para todo el mundo. Cualquier
                  persona, del nivel que sea, puede participar: no hay marca que
                  alcanzar ni clasificación previa, y el recorrido es el mismo
                  para todos. Se puede correr, trotar o caminar completo — lo
                  único que se pide es cruzar la meta, y no hay una sola manera
                  de hacerlo.
                </p>
                <p>
                  Sale de la Antigua Estación de Ferrocarril y termina en el
                  Banco de Alimentos, donde el festival ya está montado
                  esperando: música en varias zonas, comida y la rifa. Lo que se
                  recauda se queda en Durango, en el trabajo del Banco de
                  Alimentos.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
