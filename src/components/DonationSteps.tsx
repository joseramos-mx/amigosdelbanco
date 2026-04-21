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
    pre: "¡Listo! Haz apoyado al banco de manera segura",
    highlight: null,
    post: "",
    subtitle:
      "Ahora eres donante y si lo decidiste tu nombre aparecerá en la lista de donantes",
    image: "/step3.png",
  },
] as const;

export default function DonationSteps() {
  const [active, setActive] = useState(0);
  const outerRef = useRef<HTMLDivElement>(null);

  useLenis(({ scroll }) => {
    if (!outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const sectionTop = scroll + rect.top;
    // Each step gets one full viewport of scroll room
    const scrollRange = window.innerHeight * STEPS.length;
    const scrolled = scroll - sectionTop;
    const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
    const step = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
    setActive(step);
  });

  return (
    // Outer div is (STEPS.length + 1) × 100vh tall so the sticky inner
    // has exactly STEPS.length × 100vh of scroll room before it unsticks.
    <div
      ref={outerRef}
      style={{ height: `${(STEPS.length + 1) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden bg-white px-5 sm:px-6">
        <div className="mx-auto grid max-w-6xl w-full grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">

          {/* ── Phone mockup ──────────────────────────────────────────────── */}
          <div className="mx-auto w-full max-w-[320px] md:max-w-none">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{ aspectRatio: "16 / 13" }}
            >
              {STEPS.map((step, i) => (
                <img
                  key={i}
                  src={step.image}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    active === i ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
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
                style={{ animation: "float 4s ease-in-out infinite" }}
              >
                <span className="text-center text-[8px] font-extrabold uppercase leading-tight text-white sm:text-[10px]">
                  ¡YO<br />APOYO!<br />al BANCO<br />DURANGO
                </span>
              </div>
            </div>

            {/* Step list */}
            <div className="flex flex-col gap-6 sm:gap-7">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4">
                  {/* Arrow indicator — md+ only */}
                  <div
                    className="mt-2 hidden shrink-0 transition-opacity duration-500 md:block"
                    style={{ opacity: active === i ? 1 : 0 }}
                  >
                    <Image src="/arrow.svg" alt="" width={36} height={25} className="block" />
                  </div>

                  {/* Step number */}
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-colors duration-500 sm:h-9 sm:w-9 sm:text-base ${
                      active === i ? "bg-gray-900" : "bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* Text */}
                  <div
                    className={`transition-opacity duration-500 ${
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
                </div>
              ))}
            </div>

            {/* Progress dots */}
            <div className="mt-7 flex gap-2 sm:mt-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
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
