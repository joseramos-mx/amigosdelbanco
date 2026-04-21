import type React from "react";
import Image from "next/image";
import Link from "next/link";
import HeroClouds from "@/components/HeroClouds";

const maskStyle = (n: 1 | 2 | 3) =>
  ({
    WebkitMaskImage: `url('/mask%20${n}.svg')`,
    maskImage: `url('/mask%20${n}.svg')`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  } as React.CSSProperties);

const RATIOS = {
  1: "498.41 / 337.07",
  2: "717.28 / 293.5",
  3: "512.55 / 487.87",
} as const;

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-brand-blue to-[#0082d8]">
      {/* ── Background clouds ─────────────────────────────────────────── */}
      <HeroClouds />

      {/* ── Hero copy ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pt-24 pb-6 text-center sm:pt-32 sm:px-6">
        <h1 className="select-none leading-tight text-white">
          <span
            className="block text-5xl font-normal tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ animation: "fade-up 0.65s ease-out 0.15s both" }}
          >
            Por un durango
          </span>
          <span
            className="block text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl"
            style={{ animation: "fade-up 0.65s ease-out 0.28s both" }}
          >
            sin hambre
          </span>
        </h1>

        {/* Swoosh */}
        <div
          className="mt-1 w-full max-w-xs sm:max-w-xl md:max-w-2xl"
          style={{ animation: "fade-up 0.5s ease-out 0.42s both" }}
        >
          <Image src="/swoosh.svg" alt="" width={600} height={32} className="w-full" aria-hidden />
        </div>

        <p
          className="mt-5 max-w-sm text-sm leading-relaxed text-white/75 sm:max-w-xl sm:text-base md:text-sm"
          style={{ animation: "fade-up 0.65s ease-out 0.5s both" }}
        >
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod
          tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad
        </p>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          style={{ animation: "fade-up 0.65s ease-out 0.6s both" }}
        >
          <Link
            href="/donar"
            className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 sm:px-8 sm:text-base"
          >
            Donar ahora
          </Link>
          <Link
            href="/historia"
            className="top-10 rounded-full border-2 border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-8 sm:text-base"
          >
            Ver historia
          </Link>
        </div>
      </div>

      {/* ── Cards ─────────────────────────────────────────────────────── */}
      {/*
        Mobile : vertical stack, full width
        md+    : 3-column grid, aligned to bottom
      */}
      <div
        className="
          relative z-10 mt-4 flex flex-col gap-4 px-5 pb-8
          sm:px-6
          md:mx-auto md:-mt-8.5 md:mb-10 md:grid md:max-w-7xl md:w-full
          md:grid-cols-3 md:items-end md:gap-5 md:pb-0
        "
        style={{ animation: "fade-up 0.7s ease-out 0.72s both" }}
      >
        {/* Card 1 — Volunteer */}
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden"
            style={{ ...maskStyle(1), aspectRatio: RATIOS[1] }}
          >
            <Image src="/imagen1.png" alt="Voluntario" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/30" />
            <div className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
              <Link
                href="/voluntarios"
                className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-bold text-white shadow transition-opacity hover:opacity-90 sm:px-5 sm:py-2 sm:text-sm"
              >
                Ser voluntario
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-yellow px-5 py-3 text-center sm:px-6 sm:py-4">
            <p className="text-lg font-extrabold leading-tight text-[#451703] sm:text-xl">
              Únete a<br />8000+ Donantes
            </p>
          </div>
        </div>

        {/* Card 2 — Group photo */}
        <div
          className="relative overflow-hidden"
          style={{ ...maskStyle(2), aspectRatio: RATIOS[2] }}
        >
          <Image src="/imagen2.png" alt="Voluntarios del Banco de Alimentos Durango" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
        </div>

        {/* Card 3 — Historia */}
        <div className="flex flex-col justify-end">
          <div
            className="relative overflow-hidden"
            style={{ ...maskStyle(3), aspectRatio: RATIOS[3] }}
          >
            <Image src="/imagen3.png" alt="Historia" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/2" />
            <div className="absolute inset-0 z-10 flex items-end mb-20 justify-center">
              <Link
                href="/historia"
                className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow transition-opacity hover:opacity-90 sm:px-6 sm:text-sm"
              >
                Ver historia
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
