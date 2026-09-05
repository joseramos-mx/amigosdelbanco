import Image from "next/image";
import Reveal from "./Reveal";
import VideoLoop from "./VideoLoop";

/**
 * Qué es el Social Run.
 *
 * Va pegada al bento, antes de la ruta: es lo primero que se lee al bajar y
 * responde la pregunta que trae quien acaba de llegar a la página. Foto a la
 * izquierda, explicación en ámbar a la derecha.
 */

const CLIPS = [
  {
    videoSrc: "/run/videos/video1.mp4",
    autor: "@luisamunozc18",
  },
  {
    videoSrc: "/run/videos/video2.mp4",
    autor: "@dosdos.coffee",
  },
];

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
                  para todos. Se puede correr, trotar o caminar completo lo
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

          {/* Así se vive: mismo patrón ámbar/contenido de arriba, ahora con clips propios */}
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.69fr)]">
            <div className="flex flex-col justify-center rounded-[20px] bg-run-amber px-7 py-10 sm:px-10">
              <p className="font-geist text-[clamp(1.8rem,3.2vw,2.6rem)] font-bold uppercase leading-none tracking-tight text-black/85">
                Así se vive
              </p>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-black/70">
                Esta edición del Social Run se llenará de energía, música y
                comunidad. Así lo vivieron quienes ya experimentaron una
                Social Run.
              </p>

              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="font-geist text-3xl font-bold text-black/85">
                    9,000
                  </p>
                  <p className="text-sm text-black/60">cupos</p>
                </div>
                <div>
                  <p className="font-geist text-3xl font-bold text-black/85">
                    4
                  </p>
                  <p className="text-sm text-black/60">moods</p>
                </div>
                <div>
                  <p className="font-geist text-3xl font-bold text-black/85">
                    5
                  </p>
                  <p className="text-sm text-black/60">kilómetros</p>
                </div>
              </div>
            </div>

            {/* MÓVIL: Un solo cuadro que reproduce los videos en bucle */}
            <div className="block sm:hidden w-full">
              <VideoLoop clips={CLIPS} />
            </div>

            {/* ESCRITORIO: Grid con ambos videos lado a lado */}
            <div className="hidden sm:grid gap-3 sm:grid-cols-2">
              {CLIPS.map((clip) => (
                <div
                  key={clip.autor}
                  className="group relative overflow-hidden rounded-[20px] bg-black sm:h-full"
                >
                  <video
                    src={clip.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/5" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <span className="font-geist text-sm font-semibold text-white">
                      {clip.autor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div >
    </section >
  );
}