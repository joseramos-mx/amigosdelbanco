"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import HeroClouds from "@/components/HeroClouds";
import { formatDonorCount } from "@/lib/donation";

interface HeroProps {
  donorCount?: number;
}

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

const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const swooshDraw = {
  hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
  show: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ donorCount = 0 }: HeroProps) {
  const donorLabel = formatDonorCount(donorCount);

  return (
    // reducedMotion="user" respects the OS setting normally; switch to "never"
    // if you want animations even when "Reduce motion" is on.
    <MotionConfig reducedMotion="never">
      <section className="relative flex min-h-screen flex-col overflow-x-hidden bg-linear-to-b from-brand-blue to-[#0082d8]">
        <HeroClouds />

        {/* ── Hero copy ─────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pt-24 pb-6 text-center sm:pt-32 sm:px-6">
          <h1 className="select-none leading-tight text-white">
            <motion.span
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
              className="block text-5xl font-normal tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Por un durango
            </motion.span>
            <motion.span
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.7, ease, delay: 0.25 }}
              className="block text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl"
            >
              sin hambre
            </motion.span>
          </h1>

          <motion.div
            initial="hidden"
            animate="show"
            variants={swooshDraw}
            transition={{ duration: 0.9, ease, delay: 0.45 }}
            className="mt-1 w-full max-w-xs sm:max-w-xl md:max-w-2xl"
          >
            <Image src="/swoosh.svg" alt="" width={600} height={32} className="w-full" aria-hidden />
          </motion.div>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease, delay: 0.55 }}
            className="mt-5 max-w-sm text-sm leading-relaxed text-white/75 sm:max-w-xl sm:text-base md:text-sm"
          >
            Cada día rescatamos alimento y lo llevamos a las familias que más lo necesitan en
            Durango. Con tu apoyo, una despensa deja de ser un sueño y se convierte en mesa servida.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease, delay: 0.65 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              href="/donar"
              className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 sm:px-8 sm:text-base"
            >
              Donar ahora
            </Link>
            <a
              href="https://youtu.be/ALJQvdfJAWY?si=HZpoxGHCLyv6ysqi"
              target="_blank"
              rel="noopener noreferrer"
              className="top-10 rounded-full border-2 border-white/40 bg-white/10 px-7 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-8 sm:text-base"
            >
              Ver historia
            </a>
          </motion.div>
        </div>

        {/* ── Cards ─────────────────────────────────────────────────── */}
        <div
          className="
            relative z-10 mt-4 flex flex-col gap-4 px-5 pb-8
            sm:px-6
            md:mx-auto md:-mt-8.5 md:mb-10 md:grid md:max-w-7xl md:w-full
            md:grid-cols-3 md:items-end md:gap-5 md:pb-0
          "
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease, delay: 0.8 }}
            className="flex flex-col gap-3"
          >
            <div className="relative overflow-hidden" style={{ ...maskStyle(1), aspectRatio: RATIOS[1] }}>
              <Image src="/imagen1.png" alt="Voluntario" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/30" />
              <div className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
                <a
                  href="https://forms.gle/8V4bNPLLgQTPyEQt7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-bold text-white shadow transition-opacity hover:opacity-90 sm:px-5 sm:py-2 sm:text-sm"
                >
                  Ser voluntario
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-yellow px-5 py-3 text-center sm:px-6 sm:py-4">
              <p className="text-lg font-extrabold leading-tight text-[#451703] sm:text-xl">
                {donorLabel.line1}<br />{donorLabel.line2}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease, delay: 0.95 }}
            className="relative overflow-hidden"
            style={{ ...maskStyle(2), aspectRatio: RATIOS[2] }}
          >
            <Image src="/imagen2.png" alt="Voluntarios del Banco de Alimentos Durango" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.7, ease, delay: 1.1 }}
            className="flex flex-col justify-end"
          >
            <div className="relative overflow-hidden" style={{ ...maskStyle(3), aspectRatio: RATIOS[3] }}>
              <Image src="/imagen3.png" alt="Historia" fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/2" />
              <div className="absolute inset-0 z-10 flex items-end mb-20 justify-center">
                <a
                  href="https://youtu.be/ALJQvdfJAWY?si=HZpoxGHCLyv6ysqi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow transition-opacity hover:opacity-90 sm:px-6 sm:text-sm"
                >
                  Ver historia
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
