import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Countdown from "./Countdown";

// ── Datos del evento ────────────────────────────────────────────────────────
// Viernes 16 de octubre de 2026, 5:00 PM. Durango usa UTC-6 todo el año.
const EVENT_ISO = "2026-10-16T17:00:00-06:00";
const EVENT_DATE = "Viernes 16 de octubre, 2026";
const EVENT_DATE_SHORT = "Viernes 16 de Oct";
const EVENT_TIME = "05:00 PM";
const EVENT_VENUE = "Antigua Estación de Ferrocarril";
const EVENT_CITY = "Durango, Dgo.";

// Destino del botón de compra — cámbialo por la liga de boletos cuando exista.
const TICKETS_URL = "/donar";

const TAGS = [
  "Festival",
  "Concierto",
  "Food village",
  "Rifa de auto",
  "Acceso al Social Run",
];

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

// Entrada escalonada — usa el keyframe `fade-up` de globals.css.
const reveal = (delay: number): CSSProperties => ({
  animation: "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
  animationDelay: `${delay}ms`,
});

const CARD = "relative rounded-[26px] border border-white/10 bg-run-card";
const LABEL =
  "font-geist-mono text-[9px] uppercase tracking-[0.22em] text-white/40 sm:text-[10px]";

export default function RunPage() {
  return (
    <main className="relative min-h-svh overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {/* Resplandor ámbar detrás del bento */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-run-amber/20 blur-[150px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-3 sm:gap-4 lg:h-[calc(100svh-2.5rem)] lg:min-h-[640px] lg:grid-cols-12 lg:grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)_auto]">
        {/* ── 1. Ticket ──────────────────────────────────────────────── */}
        <article
          className={`${CARD} col-span-2 z-10 flex flex-col p-6 sm:p-8 lg:col-span-6 lg:col-start-1 lg:row-start-1`}
          style={reveal(0)}
        >
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {TAGS.map((tag) => (
              <li
                key={tag}
                className={`${LABEL} after:ml-3 after:text-white/20 after:content-['/'] last:after:content-['']`}
              >
                {tag}
              </li>
            ))}
          </ul>

          <h1 className="mt-5 font-schabo text-[clamp(2.6rem,6.6vw,5.25rem)] uppercase leading-[0.82] tracking-[0.01em] lg:mt-7">
            Social Run <span className="text-run-amber">2026</span>
          </h1>

          <p className="mt-3 max-w-sm font-geist-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-white/50 sm:text-xs">
            Generosity is the new revolution
          </p>

          {/* El boleto se sale de su cuadro: rotado y montado sobre el borde */}
          <div className="relative z-20 mt-7 aspect-[1800/713] w-[104%] -translate-x-[2%] rotate-[-2.5deg] drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)] lg:absolute lg:bottom-[-6%] lg:left-[8%] lg:mt-0 lg:w-[62%] lg:translate-x-0 lg:-rotate-3">
            <Image
              src="/run/ticket.webp"
              alt="Founding Member Pass del Social Run 2026: viernes 16 de octubre, 5:00 PM, Antigua Estación de Ferrocarril"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain"
            />
          </div>
        </article>

        {/* ── 2. Countdown ───────────────────────────────────────────── */}
        <article
          className="relative col-span-2 rounded-[26px] bg-run-amber px-5 py-7 text-black sm:px-8 lg:col-span-6 lg:col-start-4 lg:row-start-2 lg:flex lg:flex-col lg:justify-center"
          style={reveal(120)}
        >
          {/* Chip que sobresale del borde superior */}
          <span className="absolute -top-3 right-6 rounded-full bg-black px-4 py-1.5 font-geist-mono text-[9px] uppercase tracking-[0.22em] text-white/80 sm:text-[10px]">
            Faltan
          </span>

          <p className="sr-only">
            El Social Run 2026 comienza el {EVENT_DATE} a las {EVENT_TIME}.
          </p>

          <Countdown targetIso={EVENT_ISO} />
        </article>

        {/* ── 3. Compra tu acceso ────────────────────────────────────── */}
        <article
          className={`${CARD} col-span-2 flex flex-col justify-between gap-6 p-6 sm:p-7 lg:col-span-3 lg:col-start-1 lg:row-start-2`}
          style={reveal(200)}
        >
          <div>
            <span className={LABEL}>Founding Member Pass</span>
            <h2 className="mt-3 font-schabo text-[clamp(2.2rem,4.4vw,3.5rem)] uppercase leading-[0.85] tracking-[0.01em]">
              Compra tu <span className="text-run-amber">acceso</span>
            </h2>
          </div>

          <Link
            href={TICKETS_URL}
            className="flex items-center justify-between gap-3 rounded-2xl bg-run-amber px-5 py-3.5 font-geist-mono text-[11px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-85 sm:text-xs"
          >
            Comprar
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </article>

        {/* ── 4. Foto: pareja ────────────────────────────────────────── */}
        <div
          className="relative col-span-1 aspect-[4/5] overflow-visible lg:col-span-3 lg:col-start-7 lg:row-start-1 lg:aspect-auto"
          style={reveal(280)}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[26px]">
            <Image
              src="/run/couple.webp"
              alt="Dos corredores con playeras Generous Generation en el campo"
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          </div>

          {/* Sello que se sale de la esquina */}
          <div className="absolute -right-3 -top-3 z-30 flex h-16 w-16 rotate-[-10deg] flex-col items-center justify-center rounded-full bg-run-amber text-black sm:h-20 sm:w-20">
            <span className="font-schabo text-2xl uppercase leading-none sm:text-3xl">
              16
            </span>
            <span className="font-geist-mono text-[8px] uppercase tracking-[0.2em] sm:text-[9px]">
              Oct
            </span>
          </div>
        </div>

        {/* ── 5. Foto: corredor ──────────────────────────────────────── */}
        <div
          className="relative col-span-1 aspect-[4/5] overflow-hidden rounded-[26px] lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-1 lg:aspect-auto"
          style={reveal(360)}
        >
          <Image
            src="/run/runner.webp"
            alt="Corredor con playera Generous is the new revolution en la sierra de Durango"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/70 to-transparent"
          />
          <p className="absolute bottom-5 left-5 right-5 font-geist-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-white/80 sm:text-[10px]">
            {EVENT_CITY}
          </p>
        </div>

        {/* ── 6. Cuándo y dónde ──────────────────────────────────────── */}
        <article
          className={`${CARD} col-span-2 flex flex-col justify-center gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:col-span-5 lg:col-start-5 lg:row-start-3`}
          style={reveal(440)}
        >
          <div>
            <span className={LABEL}>Fecha</span>
            <p className="mt-1.5 whitespace-nowrap font-schabo text-xl uppercase leading-none tracking-wide text-run-amber sm:text-2xl">
              <time dateTime={EVENT_ISO}>{EVENT_DATE_SHORT}</time>
            </p>
          </div>
          <div className="hidden h-9 w-px bg-white/10 sm:block" />
          <div>
            <span className={LABEL}>Sede</span>
            <p className="mt-1.5 font-schabo text-xl uppercase leading-none tracking-wide sm:text-2xl">
              {EVENT_VENUE}
            </p>
          </div>
          <div className="hidden h-9 w-px bg-white/10 sm:block" />
          <div>
            <span className={LABEL}>Hora</span>
            <p className="mt-1.5 whitespace-nowrap font-schabo text-xl uppercase leading-none tracking-wide sm:text-2xl">
              {EVENT_TIME}
            </p>
          </div>
        </article>

        {/* ── 7. Powered by ──────────────────────────────────────────── */}
        <article
          className={`${CARD} col-span-2 flex items-center justify-between gap-4 px-6 py-5 lg:col-span-4 lg:col-start-1 lg:row-start-3`}
          style={reveal(520)}
        >
          <div className="flex items-center gap-4">
            <span className={`${LABEL} hidden sm:block`}>Powered by</span>
            <Link href="/" aria-label="Banco de Alimentos de Durango">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Banco de Alimentos de Durango"
                className="w-24 brightness-0 invert transition-opacity hover:opacity-70 sm:w-28"
              />
            </Link>
          </div>
          <Link
            href="/donar"
            className="font-geist-mono text-[9px] uppercase tracking-[0.2em] text-white/40 underline-offset-4 transition-colors hover:text-run-amber sm:text-[10px]"
          >
            Donar
          </Link>
        </article>

        {/* ── 8. Wordmark ────────────────────────────────────────────── */}
        <article
          className={`${CARD} col-span-2 flex flex-col justify-center px-6 py-5 lg:col-span-3 lg:col-start-10 lg:row-start-3`}
          style={reveal(600)}
        >
          <p className="font-schabo text-3xl uppercase leading-[0.85] tracking-[0.01em] sm:text-4xl">
            Generous
          </p>
          <p className="font-schabo text-sm uppercase leading-none tracking-[0.42em] text-run-amber sm:text-base">
            Generation
          </p>
        </article>
      </div>
    </main>
  );
}
