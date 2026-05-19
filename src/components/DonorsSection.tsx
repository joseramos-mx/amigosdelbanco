import Link from "next/link";
import Reveal from "@/components/Reveal";
import { GOAL_CENTS, formatMxn } from "@/lib/donation";
import type { PublicDonor, Totals } from "@/lib/queries";

interface DonorsSectionProps {
  totals: Totals;
  donors: PublicDonor[];
}

const BRAND_LOGOS = Array.from({ length: 11 }, (_, i) => ({
  src: `/logos%20sponsor/${i + 1}.webp`,
  alt: `Patrocinador ${i + 1}`,
}));

const R = 42;
const CIRC = 2 * Math.PI * R;

function initials(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : null;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function AnonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function DonorsSection({ totals, donors }: DonorsSectionProps) {
  const progress = Math.min(totals.raised_cents / GOAL_CENTS, 1);
  const dashOffset = CIRC * (1 - progress);

  return (
    <section id="donantes" className="bg-white px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_340px] md:gap-10 lg:grid-cols-[1fr_380px]">

        {/* ── Left — title + brand grid ──────────────────────────────── */}
        <div>
          <Reveal>
            <h2 className="mb-10 max-w-sm text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
              Agradecemos profundamente<br />a nuestros donantes
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6">
              {BRAND_LOGOS.map((logo) => (
                <div
                  key={logo.src}
                  className="flex h-16 items-center justify-center rounded-xl bg-gray-50 p-3 sm:h-20 sm:p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ── Right — donation scoreboard card ──────────────────────── */}
        <Reveal delay={200} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          {/* Progress ring + stats */}
          <div className="mb-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r={R}
                  fill="none"
                  stroke="#9ae600"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm text-gray-500">Se recaudaron</p>
              <p className="text-xl font-bold leading-tight text-gray-900">
                {formatMxn(totals.raised_cents)}{" "}
                <span className="text-base font-normal text-gray-400">
                  de {formatMxn(GOAL_CENTS)}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                {totals.donation_count} {totals.donation_count === 1 ? "donación" : "donaciones"}
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mb-5 flex flex-col gap-2">
            <Link
              href="/donar"
              className="flex w-full items-center justify-center rounded-full bg-brand-lime py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Donar ahora
            </Link>
            <button className="flex w-full items-center justify-center rounded-full bg-[#1e3a1e] py-3 text-sm font-bold text-brand-lime transition-opacity hover:opacity-90">
              Compartir
            </button>
          </div>

          {/* Donor list */}
          <div className="divide-y divide-gray-100">
            {donors.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Sé el primero en aparecer aquí.
              </p>
            ) : (
              donors.map((d, i) => {
                const ini = initials(d.display_name);
                return (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                      {ini ?? <AnonIcon />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {d.display_name ?? "Anónimo"}
                      </p>
                      <p className="text-xs text-gray-400">{daysSince(d.updated_at)} d</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-700">
                      {formatMxn(d.total_donated_cents)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex gap-2">
            <Link
              href="/donantes"
              className="flex flex-1 items-center justify-center rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Ver todo
            </Link>
            <Link
              href="/donantes?destacadas=1"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <StarIcon />
              Ver destacadas
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
