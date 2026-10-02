import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RunNav from "../RunNav";
import RunFooter from "../RunFooter";
import Reveal from "../Reveal";

export const metadata: Metadata = {
  title: "Información del Evento — Festival de la Generosidad + Social Run",
  description:
    "Toda la información del Festival de la Generosidad y Social Run 2026: evento gratuito, cortesías en Estadio Caliente, circuito 3K y 6K, música en vivo y dinámicas.",
};

const GENEROS_MUSICA = [
  {
    nombre: "RAVE",
    color: "from-fuchsia-600 to-purple-800",
    borde: "border-fuchsia-500/40",
    textoColor: "text-fuchsia-400",
    desc: "Energía pura, beats electrónicos y una atmósfera electrizante para vibrar al máximo.",
  },
  {
    nombre: "SKA",
    color: "from-lime-500 to-emerald-700",
    borde: "border-lime-500/40",
    textoColor: "text-lime-400",
    desc: "Metales, ritmo bailable y el ambiente festivo que pondrá a brincar a toda la comunidad.",
  },
  {
    nombre: "OLDIES",
    color: "from-sky-500 to-blue-800",
    borde: "border-sky-500/40",
    textoColor: "text-sky-300",
    desc: "Los grandes clásicos nostálgicos que todos conocemos, cantamos y disfrutamos juntos.",
  },
  {
    nombre: "RANCHERO",
    color: "from-amber-600 to-orange-800",
    borde: "border-amber-500/40",
    textoColor: "text-amber-400",
    desc: "La fuerza de nuestra tradición, orgullo duranguense y pasión que une corazones.",
  },
];

const CRONOGRAMA = [
  {
    hora: "5:00 PM",
    titulo: "Antigua Estación de Ferrocarril",
    detalle: "Reunión, acceso y bienvenida a todos los participantes y sus familias.",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    hora: "6:00 PM",
    titulo: "Corremos juntos a ritmo moderado",
    detalle: "Arranque del Social Run acompañados de música continua a lo largo del recorrido.",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 4v6m0 0l3 3m-3-3l-3 3" />
        <circle cx="12" cy="18" r="3" />
      </svg>
    ),
  },
  {
    hora: "Circuito",
    titulo: "3KM y 6KM sobre Av. Gómez Morín",
    detalle: "Circuito urbano sobre Boulevard Felipe Pescador y Av. Gómez Morín. 1 vuelta = 3 km, 2 vueltas = 6 km.",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    hora: "7:00 - 10:00 PM",
    titulo: "Festival de la Generosidad",
    detalle: "3 horas de música en vivo con 4 géneros musicales, food village, rifa de auto y convivencia.",
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
];

export default function InfoRunPage() {
  return (
    <>
      <main className="min-h-svh px-4 pt-8 pb-16 sm:px-6 lg:px-12 lg:pt-12">
        <div className="mx-auto max-w-[1200px]">
          {/* ── Navegación superior de regreso ────────────────────────── */}
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
            <Link
              href="/run"
              className="inline-flex items-center gap-2 font-geist-mono text-xs uppercase tracking-wider text-white/70 transition-colors hover:text-run-amber sm:text-sm"
            >
              <span>←</span> Volver al Social Run
            </Link>

            <Link href="/" aria-label="Banco de Alimentos de Durango">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Banco de Alimentos de Durango"
                className="h-8 w-auto transition-opacity hover:opacity-80"
              />
            </Link>
          </div>

          {/* ── Encabezado principal con Logo del Festival ────────────── */}
          <Reveal className="text-center">
            <div className="mx-auto max-w-[720px]">
              <Image
                src="/run/assets/asset2.png"
                alt="9 de Octubre — Festival de la Generosidad + Social Run"
                width={1200}
                height={700}
                priority
                className="mx-auto h-auto w-full object-contain drop-shadow-2xl"
              />
            </div>

            <div className="mt-4 inline-block rounded-full bg-white/10 px-5 py-1.5 backdrop-blur-md">
              <p className="font-geist-mono text-xs font-semibold uppercase tracking-[0.2em] text-run-amber sm:text-sm">
                Pro Construcción del Banco de Alimentos
              </p>
            </div>

            <h1 className="mt-6 font-geist text-[clamp(1.75rem,3.8vw,3rem)] font-extrabold uppercase tracking-tight text-white">
              ¡Tu participación es <span className="text-run-amber">gratuita!</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[650px] text-sm text-white/75 sm:text-base leading-relaxed">
              Únete al gran día duranguense de la generosidad: una carrera deportiva, festival cultural,
              concierto en vivo y convivencia familiar para apoyar al Banco de Alimentos de Durango.
            </p>
          </Reveal>

          {/* ── Banner: Recoge tus cortesías en Estadio Caliente ──────── */}
          <Reveal delay={80} className="mt-10 rounded-[20px] bg-run-card border border-white/10 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
              <div className="max-w-[600px]">
                <span className="inline-block rounded-md bg-red-600 px-3 py-1 font-geist-mono text-xs font-bold uppercase tracking-wider text-white">
                  Evento Gratuito
                </span>
                <h2 className="mt-3 font-geist text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                  Recoge tus cortesías en Estadio Caliente
                </h2>
                <p className="mt-2 text-sm text-white/70 sm:text-base leading-relaxed">
                  Para participar en la carrera y disfrutar del festival, obtén tus boletos de cortesía
                  sin costo directamente en las instalaciones del Estadio Caliente Durango.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Estadio+Caliente+Durango"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-[340px] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  title="Ver ubicación del Estadio Caliente en Google Maps"
                >
                  <Image
                    src="/run/assets/asset3.png"
                    alt="Visita el Estadio Caliente para obtener tus cortesías"
                    width={747}
                    height={166}
                    className="h-auto w-full object-contain drop-shadow-md"
                  />
                </a>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Estadio+Caliente+Durango"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-geist-mono text-xs uppercase tracking-wider text-run-amber underline underline-offset-4 hover:text-white"
                >
                  Abrir mapa en Google Maps →
                </a>
              </div>
            </div>
          </Reveal>

          {/* ── Nota importante sobre el kit ──────────────────────────── */}
          <Reveal delay={120} className="mt-6 rounded-[20px] border border-run-amber/35 bg-run-amber/10 p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-geist text-sm sm:text-base font-semibold text-white">
                  <span className="text-run-amber uppercase tracking-wider font-bold">Importante:</span>{" "}
                  La cortesía de acceso al festival y a la carrera es gratuita, pero{" "}
                  <span className="text-run-amber underline">no incluye el kit del corredor</span>.
                </p>
                <p className="text-xs sm:text-sm text-white/70">
                  La playera conmemorativa, tote bag y pulsera del evento se reservan para quienes realizan un donativo a beneficio del Banco de Alimentos.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Link
                  href="/run#kit"
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 font-geist-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Ver kit
                </Link>
                <Link
                  href="/donar"
                  className="rounded-lg bg-run-amber px-5 py-2.5 font-geist-mono text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90"
                >
                  Donar
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ── Cronograma y Programa del Día ─────────────────────────── */}
          <Reveal delay={160} className="mt-14">
            <div className="text-center">
              <p className="font-geist-mono text-xs uppercase tracking-[0.2em] text-run-amber">
                Programa oficial · 9 de Octubre
              </p>
              <h2 className="mt-2 font-geist text-2xl font-bold uppercase tracking-tight text-white sm:text-4xl">
                ¿Cómo se vive la jornada?
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CRONOGRAMA.map((item, idx) => (
                <div
                  key={item.hora}
                  className="relative flex flex-col justify-between rounded-[20px] bg-run-card p-6 border border-white/5"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-run-amber/15 text-run-amber">
                      {item.icono}
                    </div>
                    <span className="mt-4 block font-geist text-2xl font-black text-white">
                      {item.hora}
                    </span>
                    <h3 className="mt-1 font-geist text-base font-bold uppercase text-run-amber leading-snug">
                      {item.titulo}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-white/65 leading-relaxed">
                      {item.detalle}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-geist-mono text-[10px] uppercase tracking-wider text-white/40">
                      Paso 0{idx + 1}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-run-amber" />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ── Música en Vivo: 4 Géneros ─────────────────────────────── */}
          <Reveal delay={200} className="mt-16 rounded-[24px] bg-run-card p-7 sm:p-10 border border-white/10">
            <div className="text-center">
              <span className="inline-block rounded-full bg-run-amber/15 px-4 py-1 font-geist-mono text-xs uppercase tracking-widest text-run-amber">
                Festival de la Generosidad
              </span>
              <h2 className="mt-3 font-geist text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
                Música en Vivo
              </h2>
              <p className="mt-2 font-geist-mono text-xs sm:text-sm uppercase tracking-wider text-white/60">
                4 géneros que harán temblar el festival
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GENEROS_MUSICA.map((gen) => (
                <div
                  key={gen.nombre}
                  className={`rounded-[18px] border ${gen.borde} bg-linear-to-b from-white/5 to-black/40 p-6 backdrop-blur-xs transition-transform hover:-translate-y-1`}
                >
                  <p className={`font-geist text-3xl font-black tracking-tight ${gen.textoColor}`}>
                    {gen.nombre}
                  </p>
                  <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed">
                    {gen.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-white/5 p-4 text-center">
              <p className="text-xs sm:text-sm text-white/75">
                🎉 Además de música continua durante la carrera, el festival contará con área de alimentos, stands de patrocinadores y dinámicas para toda la familia.
              </p>
            </div>
          </Reveal>

          {/* ── Dinámica: Día Duranguense de la Generosidad ────────────── */}
          <Reveal delay={240} className="mt-16 rounded-[24px] border border-run-amber/25 bg-linear-to-br from-[#231a0e] via-run-card to-black p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
              <div>
                <span className="font-geist-mono text-xs font-semibold uppercase tracking-widest text-run-amber">
                  Movimiento social
                </span>
                <h2 className="mt-2 font-geist text-2xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                  Día Duranguense de la Generosidad
                </h2>
                <p className="mt-4 text-sm text-white/80 sm:text-base leading-relaxed">
                  Te invitamos a que subas una foto realizando una acción buena (ayudando a alguien) el día{" "}
                  <strong className="text-white">9 de octubre</strong> a tus redes sociales utilizando el hashtag:
                </p>
                <div className="my-4 inline-block rounded-xl bg-black/60 px-5 py-3 border border-run-amber/40">
                  <span className="font-geist text-xl sm:text-2xl font-black text-run-amber tracking-wider">
                    #GGDURANGO
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  Y no olvides etiquetar a <span className="font-semibold text-white">@bda_durango</span>.
                  ¡Hagamos juntos del 9 de octubre el gran día duranguense de la generosidad!
                </p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-[20px] bg-black/40 p-6 border border-white/10 text-center">
                <span className="font-geist-mono text-xs uppercase tracking-widest text-white/50">
                  Patrocinador Oficial
                </span>
                <div className="mt-3 flex items-center justify-center">
                  <span className="font-schabo text-4xl text-white tracking-wider">
                    ALLPRO PRODUCCIONES
                  </span>
                </div>
                <div className="mt-5 h-px w-full bg-white/10" />
                <p className="mt-4 text-xs text-white/60">
                  Agradecemos a todos nuestros aliados y patrocinadores que hacen posible este evento gratuito para la sociedad de Durango.
                </p>
              </div>
            </div>
          </Reveal>

          {/* ── Tira de Patrocinadores ────────────────────────────────── */}
          <Reveal delay={280} className="mt-14 rounded-[20px] bg-white p-6 sm:p-8">
            <p className="mb-4 text-center font-geist-mono text-xs font-bold uppercase tracking-wider text-black/60">
              Empresas y organizaciones aliadas
            </p>
            <div className="w-full overflow-hidden">
              <Image
                src="/run/assets/asset1.png"
                alt="Patrocinadores y aliados del Festival de la Generosidad y Banco de Alimentos de Durango"
                width={3000}
                height={280}
                className="h-auto w-full object-contain"
              />
            </div>
          </Reveal>

          {/* ── Botones finales de acción ─────────────────────────────── */}
          <Reveal delay={300} className="mt-14 text-center">
            <h3 className="font-geist text-2xl font-bold uppercase tracking-tight text-white">
              ¿Listo para ser parte de la revolución de la generosidad?
            </h3>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/run"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-geist-mono text-xs uppercase tracking-wider text-white transition-colors hover:bg-white/15"
              >
                Volver a la portada
              </Link>
              <Link
                href="/donar"
                className="rounded-xl bg-run-amber px-8 py-3.5 font-geist-mono text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 shadow-lg shadow-run-amber/20"
              >
                Hacer un donativo voluntario
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <RunFooter />

      {/* Espacio para la barra de navegación fija */}
      <div aria-hidden className="h-24 sm:h-28" />

      <RunNav base="/run" ctaHref="/donar" />
    </>
  );
}
