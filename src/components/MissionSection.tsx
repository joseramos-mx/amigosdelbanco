import Image from "next/image";
import Link from "next/link";
import type React from "react";
import Reveal from "@/components/Reveal";
import { GOAL_MXN, percentOfGoal } from "@/lib/donation";
import type { Totals } from "@/lib/queries";

interface MissionSectionProps {
  totals: Totals;
}

const SEGMENTS = 10;

const maskStyle: React.CSSProperties = {
  WebkitMaskImage: "url('/mask%204.svg')",
  maskImage: "url('/mask%204.svg')",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

export default function MissionSection({ totals }: MissionSectionProps) {
  const percent = percentOfGoal(totals.raised_cents);
  const filled = Math.round((percent / 100) * SEGMENTS);

  return (
    <section id="mision" className="bg-white px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">

        {/* ── Top row — title + description ─────────────────────────── */}
        <Reveal className="mb-12 grid grid-cols-1 gap-6 sm:mb-16 md:grid-cols-2 md:gap-16">
          <h2 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Nuestra misión va de la mano<br />con nuestros valores
          </h2>

          <p className="text-sm leading-relaxed text-gray-500 sm:text-base md:pt-2">
            Creemos que nadie en Durango debería irse a dormir con hambre. Rescatamos alimento
            de productores, comercios y donantes, y lo entregamos con dignidad a quienes hoy
            lo necesitan, transformando lo que sobra en lo que falta.
          </p>
        </Reveal>

        {/* ── Bottom row — image + values card ──────────────────────── */}
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">

          {/* Image with mask 4 */}
          <Reveal delay={100}>
            <div
              className="relative overflow-hidden"
              style={{ ...maskStyle, aspectRatio: "869.38 / 490.43" }}
            >
              <Image
                src="/imagen2.png"
                alt="Manos compartiendo alimento"
                fill
                sizes="(max-width: 768px) 90vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          {/* Values card */}
          <Reveal delay={200}>
            <h3 className="mb-3 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              Alimenta el futuro<br />y la esperanza
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:text-base">
              Tu donación se convierte en despensas, en comidas calientes y en oportunidades
              para que niñas, niños y adultos mayores recuperen fuerzas. Con cada peso
              recaudado avanzamos hacia un Durango donde nadie pase hambre.
            </p>

            {/* Segmented progress bar */}
            <div className="mb-2 flex gap-1.5 sm:gap-2">
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <div
                  key={i}
                  className={`h-7 flex-1 rounded-lg transition-colors sm:h-8 ${
                    i < filled ? "bg-brand-lime" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Progress labels */}
            <div className="mb-6 flex items-center justify-between text-xs text-gray-500 sm:text-sm">
              <span>Recaudado hasta ahora {percent}%</span>
              <span className="font-semibold text-gray-800">
                Objetivo ${GOAL_MXN.toLocaleString("es-MX")}
              </span>
            </div>

            <Link
              href="/donar"
              className="inline-flex rounded-full bg-brand-yellow px-8 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-base"
            >
              Donar ahora
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
