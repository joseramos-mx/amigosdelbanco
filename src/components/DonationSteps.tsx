"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";

const INTERVAL_MS = 3500;

const STEPS = [
  {
    pre: "Entra en el apartado de ",
    highlight: "donación",
    post: "",
    subtitle: "Ahí podrás llenar tus datos de donante",
  },
  {
    pre: "Haz tu donación con tus datos bancarios",
    highlight: null,
    post: "",
    subtitle: "Puedes utilizar tu método de pago preferido",
  },
  {
    pre: "¡Listo! Haz apoyado al banco de manera segura",
    highlight: null,
    post: "",
    subtitle:
      "Ahora eres donante y si lo decidiste tu nombre aparecerá en la lista de donantes",
  },
] as const;

const STEP_BG = ["#dbeafe", "#fef9c3", "#dcfce7"] as const;

export default function DonationSteps() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setActive((p) => (p + 1) % STEPS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(advance, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, advance]);

  const handleStepClick = (i: number) => {
    setActive(i);
    setPaused(true);
  };

  return (
    <section className="bg-white px-5 py-10 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16 ">

        {/* ── Phone mockup ──────────────────────────────────────────────── */}
        <div className="mx-auto w-full max-w-[320px] md:max-w-none">
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{ aspectRatio: "4 / 5" }}
          >
            <img src="step1.png" alt="" className="object-cover w-full h-full"/>
            {/* Pause / play */}
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reanudar" : "Pausar"}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-white/15 text-white transition-colors hover:bg-white/30"
            >
              {paused ? (
                <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                  <path d="M2 1.5l11 6.5-11 6.5V1.5z" />
                </svg>
              ) : (
                <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
                  <rect x="1" y="1" width="4" height="14" rx="1.5" />
                  <rect x="9" y="1" width="4" height="14" rx="1.5" />
                </svg>
              )}
            </button>

            
          </div>
        </div>

        {/* ── Steps ─────────────────────────────────────────────────────── */}
        <div>
          {/* Title + sticker */}
          <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
            <h2 className="text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl md:text-4xl">
              ¿Cómo puedo donar<br />y apoyar al banco<br />de alimentos?
            </h2>

            {/* Sticker placeholder */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-yellow sm:h-20 sm:w-20 md:h-24 md:w-24">
              <span className="text-center text-[8px] font-extrabold uppercase leading-tight text-white sm:text-[10px]">
                ¡YO<br />APOYO!<br />al BANCO<br />DURANGO
              </span>
            </div>
          </div>

          {/* Step list */}
          <div className="flex flex-col gap-6 sm:gap-7">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                className="flex cursor-pointer items-start gap-3 text-left sm:gap-4"
              >
                {/* Arrow — hidden on mobile, shown md+ */}
                <div
                  className="mt-2 hidden shrink-0 transition-opacity duration-300 md:block"
                  style={{ opacity: active === i ? 1 : 0 }}
                >
                  <Image src="/arrow.svg" alt="" width={36} height={25} className="block" />
                </div>

                {/* Number */}
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-colors duration-300 sm:h-9 sm:w-9 sm:text-base ${
                    active === i ? "bg-gray-900" : "bg-gray-300"
                  }`}
                >
                  {i + 1}
                </span>

                {/* Text */}
                <div
                  className={`transition-opacity duration-300 ${
                    active === i ? "opacity-100" : "opacity-45"
                  }`}
                >
                  <p className="text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                    {step.highlight ? (
                      <>
                        {step.pre}
                        <span className="relative inline-block">
                          {step.highlight}
                          <span className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] rounded-full bg-brand-yellow" />
                        </span>
                        {step.post}
                      </>
                    ) : (
                      step.pre
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-7 flex gap-2 sm:mt-8">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                aria-label={`Paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active === i ? "w-6 bg-brand-blue" : "w-1.5 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
