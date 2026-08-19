import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BotonLateral from "./BotonLateral";
import Countdown from "./Countdown";
import RunNav from "./RunNav";
import Reveal from "./Reveal";
import RunFooter from "./RunFooter";
import SeccionKit from "./SeccionKit";
import SeccionMoods from "./SeccionMoods";
import SeccionQueEs from "./SeccionQueEs";
import SeccionRuta from "./SeccionRuta";

// ── Datos del evento ────────────────────────────────────────────────────────
// Viernes 0* de octubre de 2026, 5:00 PM. Durango usa UTC-6 todo el año.
const EVENT_ISO = "2026-10-09T17:00:00-06:00";
const EVENT_DATE = "Viernes 09 de octubre, 2026";
const EVENT_TIME = "05:00 PM";
const EVENT_VENUE = "Antigua Estación de Ferrocarril";

// Checkout propio del evento. La inscripción es contraprestación, no donativo:
// no debe cobrarse por /donar, que emite recibos deducibles.
const TICKETS_URL = "/run/inscripcion";

const DESCRIPTION = `Social Run 2026 de Generous Generation: festival, concierto, food village y rifa de auto. ${EVENT_DATE}, ${EVENT_TIME}, ${EVENT_VENUE} en Durango. Powered by Banco de Alimentos de Durango.`;

export const metadata: Metadata = {
  title: { absolute: "Social Run 2026 — Generous Generation" },
  description: DESCRIPTION,
  alternates: { canonical: "/run" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/run",
    title: "Social Run 2026 — Generous Generation",
    description: DESCRIPTION,
    images: [
      {
        url: "/run/og.jpg",
        width: 1200,
        height: 630,
        alt: "Founding Member Pass del Social Run 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Run 2026 — Generous Generation",
    description: DESCRIPTION,
    images: ["/run/og.jpg"],
  },
};

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: "Social Run 2026 — Generous Generation",
  startDate: EVENT_ISO,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  description: DESCRIPTION,
  image: "/run/og.jpg",
  location: {
    "@type": "Place",
    name: EVENT_VENUE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Durango",
      addressRegion: "Dgo.",
      addressCountry: "MX",
    },
  },
  organizer: {
    "@type": "NGO",
    name: "Banco de Alimentos de Durango A.C.",
    url: "https://bancodealimentosdurango.org",
  },
} as const;

const CARD = "rounded-[20px] bg-run-card";

export default function RunPage() {
  return (
    <>
      <main className="min-h-svh p-4 sm:p-6 lg:p-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />

        <h1 className="sr-only">
          Social Run 2026 — Generous Generation. {EVENT_DATE}, {EVENT_TIME},{" "}
          {EVENT_VENUE}, Durango.
        </h1>

        {/* Retícula de 15 columnas: 7/4/4 · 4/7/4 · 4/11 */}
        <div id="inicio" className="mx-auto grid max-w-[1500px] grid-cols-2 gap-3 lg:h-[calc(100svh-6rem)] lg:grid-cols-15 lg:grid-rows-[1.95fr_2.5fr_1fr]">
          {/* ── Boleto: PNG suelto, sin tarjeta ni fondo ───────────────── */}
          <Reveal delay={0} className="col-span-2 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <Image
              src="/run/ticket.webp"
              alt="Founding Member Pass del Social Run 2026: festival, concierto, food village y rifa de auto. Viernes 16 de octubre, 5:00 PM, Antigua Estación de Ferrocarril."
              width={1800}
              height={713}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-contain object-left"
            />
          </Reveal>

          {/* ── Cuenta regresiva ──────────────────────────────────────── */}
          <Reveal delay={200} className="col-span-2 flex items-center justify-center rounded-[20px] bg-run-amber px-4 py-8 text-black lg:col-span-7 lg:col-start-5 lg:row-start-2 lg:py-0">
            <Countdown targetIso={EVENT_ISO} />
          </Reveal>

          {/* ── Compra tu acceso ──────────────────────────────────────── */}
          <Reveal
            delay={120}
            className={`${CARD} relative col-span-2 flex flex-col justify-center overflow-hidden px-6 py-8 lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:px-9`}
          >
            {/* Decorativa: lo que dice la tarjeta ya está en el texto. */}
            <Image
              src="/run/comprar-bg.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
            {/* La foto tiene zonas claras y el texto va en blanco: sin el velo
                se pierde. Más oscuro abajo, que es donde cae el botón. */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/35" />

            <div className="relative">
              <p className="text-center text-[clamp(1.9rem,3.1vw,2.9rem)] uppercase leading-[1.02] tracking-tight">
                <span className="block font-bold">Compra tu</span>
                <span className="block">Acceso</span>
              </p>

              <Link
                href={TICKETS_URL}
                className="mt-7 block rounded-md bg-run-amber py-3 text-center text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
              >
                Comprar
              </Link>
            </div>
          </Reveal>

          {/* ── Foto: pareja ──────────────────────────────────────────── */}
          <Reveal delay={80} className="relative col-span-1 aspect-3/4 overflow-hidden rounded-[20px] lg:col-span-4 lg:col-start-8 lg:row-start-1 lg:aspect-auto">
            <Image
              src="/run/couple.webp"
              alt="Dos corredores con playeras Generous Generation en el campo"
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          </Reveal>

          {/* ── Foto: corredor ────────────────────────────────────────── */}
          <Reveal delay={160} className="relative col-span-1 aspect-3/4 overflow-hidden rounded-[20px] lg:col-span-4 lg:col-start-12 lg:row-span-2 lg:row-start-1 lg:aspect-auto">
            <Image
              src="/run/runner.webp"
              alt="Corredor con playera Generous is the new revolution en la sierra de Durango"
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          </Reveal>

          {/* ── Powered by ────────────────────────────────────────────── */}
          <Reveal
            delay={280}
            className={`${CARD} col-span-2 flex items-center justify-center gap-4 px-4 py-6 lg:col-span-4 lg:col-start-1 lg:row-start-3 lg:gap-5`}
          >
            <Link href="/" aria-label="Banco de Alimentos de Durango">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Banco de Alimentos de Durango"
                className="h-9 w-auto transition-opacity hover:opacity-70 lg:h-11"
              />
            </Link>
            <Image
              src="/run/sponsors.webp"
              alt="Patrocinadores del Social Run"
              width={900}
              height={139}
              className="h-5 w-auto lg:h-7"
            />
          </Reveal>

          {/* ── Franja: fecha, sede, hora y wordmark ──────────────────── */}
          <Reveal
            delay={320}
            className={`${CARD} col-span-2 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 px-7 py-6 lg:col-span-11 lg:col-start-5 lg:row-start-3 lg:flex-nowrap lg:px-10 lg:py-0`}
          >
            <p className="text-[13px] uppercase leading-[1.35] tracking-wide lg:text-sm">
              Viernes <span className="font-bold">09 de Oct</span>
              <br />
              Antigua Estación
              <br />
              de Ferrocarril
            </p>

            <p className="text-xl font-bold lg:text-2xl">{EVENT_TIME}</p>

            <p className="text-[11px] font-bold uppercase leading-[1.35] tracking-wide">
              Generosity is the
              <br />
              new revolution
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/run/gglogo.svg"
              alt="Generous Generation"
              className="h-10 w-auto shrink-0 lg:h-12"
            />
          </Reveal>
        </div>
      </main>

      <SeccionQueEs />

      <SeccionRuta />

      <SeccionMoods />

      <SeccionKit />

      <RunFooter />

      {/* Hueco para que la barra fija no se coma el final del pie. */}
      <div aria-hidden className="h-24 sm:h-28" />

      <BotonLateral href={TICKETS_URL}>Comprar boleto</BotonLateral>

      <RunNav ctaHref={TICKETS_URL} destacado />
    </>
  );
}
