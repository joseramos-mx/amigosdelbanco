"use client";

import Image from "next/image";
import { useRef } from "react";
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

// How wide (in "step units") a slide's fade is.
const FADE_WIDTH = 0.6;

// Tailwind palette refs — kept local so we can write directly to .style
// without round-tripping through React/className.
const COLOR_NUMBER_ACTIVE = "#111827";   // gray-900
const COLOR_NUMBER_IDLE = "#d1d5db";     // gray-300
const COLOR_DOT_ACTIVE = "#1d4dfc";      // brand-blue
const COLOR_DOT_IDLE = "#e5e7eb";        // gray-200

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function DonationSteps() {
  const outerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const arrowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Lenis already runs inside a single RAF — writing directly to .style here
  // avoids the React reconciliation cost on every scroll frame, which is what
  // was causing jank on slower devices.
  useLenis(({ scroll }) => {
    if (!outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const sectionTop = scroll + rect.top;
    const scrollRange = window.innerHeight * STEPS.length;
    const scrolled = scroll - sectionTop;
    const progress = Math.max(
      0,
      Math.min(STEPS.length - 0.0001, (scrolled / scrollRange) * STEPS.length),
    );
    const active = Math.min(STEPS.length - 1, Math.floor(progress));

    for (let i = 0; i < STEPS.length; i++) {
      const distance = Math.abs(progress - i);
      const t = Math.max(0, Math.min(1, 1 - distance / FADE_WIDTH));
      const eased = easeInOutCubic(t);
      const isActive = active === i;

      const img = imageRefs.current[i];
      if (img) {
        img.style.opacity = String(eased);
        img.style.transform = `scale(${1 + (1 - t) * 0.04})`;
      }

      const text = textRefs.current[i];
      if (text) {
        text.style.opacity = String(0.4 + 0.6 * eased);
        text.style.transform = `translate3d(0, ${(1 - eased) * 4}px, 0)`;
      }

      const arrow = arrowRefs.current[i];
      if (arrow) {
        arrow.style.opacity = String(eased);
      }

      const number = numberRefs.current[i];
      if (number) {
        number.style.backgroundColor = isActive ? COLOR_NUMBER_ACTIVE : COLOR_NUMBER_IDLE;
      }

      const dot = dotRefs.current[i];
      if (dot) {
        dot.style.width = isActive ? "1.5rem" : "0.375rem";
        dot.style.backgroundColor = isActive ? COLOR_DOT_ACTIVE : COLOR_DOT_IDLE;
      }
    }
  });

  return (
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
                  ref={(el) => { imageRefs.current[i] = el; }}
                  src={step.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    opacity: i === 0 ? 1 : 0,
                    transform: i === 0 ? "scale(1)" : "scale(1.04)",
                    willChange: "opacity, transform",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Steps ─────────────────────────────────────────────────────── */}
          <div>
            <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
              <h2 className="text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl md:text-4xl">
                ¿Cómo puedo donar<br />y apoyar al banco<br />de alimentos?
              </h2>
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-yellow sm:h-20 sm:w-20 md:h-24 md:w-24"
                style={{ animation: "float 7s ease-in-out infinite" }}
              >
                <span className="text-center text-[8px] font-extrabold uppercase leading-tight text-white sm:text-[10px]">
                  ¡YO<br />APOYO!<br />al BANCO DE ALIMENTOS<br />DURANGO
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:gap-7">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4">
                  <div
                    ref={(el) => { arrowRefs.current[i] = el; }}
                    className="mt-2 hidden shrink-0 md:block"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                  >
                    <Image src="/arrow.svg" alt="" width={36} height={25} className="block" />
                  </div>

                  <span
                    ref={(el) => { numberRefs.current[i] = el; }}
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white sm:h-9 sm:w-9 sm:text-base"
                    style={{
                      backgroundColor: i === 0 ? COLOR_NUMBER_ACTIVE : COLOR_NUMBER_IDLE,
                      transition: "background-color 0.6s ease-out",
                    }}
                  >
                    {i + 1}
                  </span>

                  <div
                    ref={(el) => { textRefs.current[i] = el; }}
                    style={{
                      opacity: i === 0 ? 1 : 0.4,
                      transform: i === 0 ? "translate3d(0,0,0)" : "translate3d(0,4px,0)",
                      willChange: "opacity, transform",
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
              ))}
            </div>

            <div className="mt-7 flex gap-2 sm:mt-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  ref={(el) => { dotRefs.current[i] = el; }}
                  className="h-1.5 rounded-full"
                  style={{
                    width: i === 0 ? "1.5rem" : "0.375rem",
                    backgroundColor: i === 0 ? COLOR_DOT_ACTIVE : COLOR_DOT_IDLE,
                    transition: "width 0.5s ease-out, background-color 0.5s ease-out",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
