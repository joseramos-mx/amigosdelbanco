"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useLenis } from "lenis/react";

const STEPS = [
  {
    pre: "Entra en el apartado de ",
    highlight: "donación",
    post: "",
    subtitle: "Ahí podrás llenar tus datos de donante",
    image: "/step1.png",
  },
  {
    pre: "Haz tu donación con tus datos bancarios",
    highlight: null,
    post: "",
    subtitle: "Puedes utilizar tu método de pago preferido",
    image: "/step2.png",
  },
  {
    pre: "¡Listo! Has apoyado al banco de manera segura",
    highlight: null,
    post: "",
    subtitle:
      "Ahora eres donante y si lo decidiste tu nombre aparecerá en la lista de donantes",
    image: "/step3.png",
  },
] as const;

// How wide (in "step units") a slide's fade is. 0.6 = a slide is fully
// visible at its index and fades over 60% of one step on each side.
const FADE_WIDTH = 0.6;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function DonationSteps() {
  const [progress, setProgress] = useState(0);
  const outerRef = useRef<HTMLDivElement>(null);

  useLenis(({ scroll }) => {
    if (!outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const sectionTop = scroll + rect.top;
    const scrollRange = window.innerHeight * STEPS.length;
    const scrolled = scroll - sectionTop;
    const raw = (scrolled / scrollRange) * STEPS.length;
    setProgress(Math.max(0, Math.min(STEPS.length - 0.0001, raw)));
  });

  const active = Math.min(STEPS.length - 1, Math.floor(progress));

  return (
    <div
      ref={outerRef}
      style={{ height: `${(STEPS.length + 1) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden bg-white px-5 sm:px-6">
        <div className="mx-auto grid max-w-6xl w-full grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">

          {/* ── Phone mockup with progressive crossfade ──────────────────── */}
          <div className="mx-auto w-full max-w-[320px] md:max-w-none">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{ aspectRatio: "16 / 13" }}
            >
              {STEPS.map((step, i) => {
                const distance = Math.abs(progress - i);
                const t = Math.max(0, Math.min(1, 1 - distance / FADE_WIDTH));
                const opacity = easeInOutCubic(t);
                // Subtle zoom: active slide sits at scale 1, fading slides
                // hold slightly larger for parallax depth.
                const scale = 1 + (1 - t) * 0.04;
                return (
                  <img
                    key={i}
                    src={step.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover will-change-[opacity,transform]"
                    style={{ opacity, transform: `scale(${scale})` }}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Steps ─────────────────────────────────────────────────────── */}
          <div>
            {/* Title + sticker */}
            <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
              <h2 className="text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl md:text-4xl">
                ¿Cómo puedo donar<br />y apoyar al banco<br />de alimentos?
              </h2>
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-yellow sm:h-20 sm:w-20 md:h-24 md:w-24"
                style={{ animation: "float 7s ease-in-out infinite" }}
              >
                <span className="text-center text-[8px] font-extrabold uppercase leading-tight text-white sm:text-[10px]">
                  ¡YO<br />APOYO!<br />al BANCO<br />DURANGO
                </span>
              </div>
            </div>

            {/* Step list — opacity + lift driven by continuous progress */}
            <div className="flex flex-col gap-6 sm:gap-7">
              {STEPS.map((step, i) => {
                const distance = Math.abs(progress - i);
                const t = Math.max(0, Math.min(1, 1 - distance / FADE_WIDTH));
                const eased = easeInOutCubic(t);
                const textOpacity = 0.4 + 0.6 * eased;
                const translateY = (1 - eased) * 4;
                return (
                  <div key={i} className="flex items-start gap-3 sm:gap-4">
                    {/* Arrow */}
                    <div
                      className="mt-2 hidden shrink-0 md:block"
                      style={{ opacity: eased }}
                    >
                      <Image src="/arrow.svg" alt="" width={36} height={25} className="block" />
                    </div>

                    {/* Step number */}
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-colors duration-700 ease-out sm:h-9 sm:w-9 sm:text-base ${
                        active === i ? "bg-gray-900" : "bg-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>

                    {/* Text */}
                    <div
                      className="will-change-[opacity,transform]"
                      style={{
                        opacity: textOpacity,
                        transform: `translateY(${translateY}px)`,
                      }}
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
                  </div>
                );
              })}
            </div>

            {/* Progress dots */}
            <div className="mt-7 flex gap-2 sm:mt-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    active === i ? "w-6 bg-brand-blue" : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
