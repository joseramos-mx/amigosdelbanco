import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, HeartStraight, Users, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getPublicDonors, getTotals } from "@/lib/queries";
import { formatMxn } from "@/lib/donation";

export const metadata: Metadata = {
  title: "Donantes — Banco de Alimentos",
  description: "Conoce a las personas y organizaciones que apoyan al Banco de Alimentos de Durango.",
};

export const dynamic = "force-dynamic";

function initials(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : null;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export default async function DonantesPage() {
  // Pull a generous slice — adjust the limit if the list grows beyond this.
  const [donors, totals] = await Promise.all([
    getPublicDonors(100),
    getTotals(),
  ]);

  return (
    <main className="min-h-screen bg-linear-to-b from-amber-50 via-white to-gray-50 px-5 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-2xl">

        {/* ── Back link ─────────────────────────────────────────────── */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={16} weight="bold" />
          Volver al inicio
        </Link>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-8 text-center sm:mb-10">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
            <HandHeart size={14} weight="fill" />
            Donantes
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Gracias a quienes hacen<br className="hidden sm:block" /> esto posible
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            Cada donante en esta lista ha aportado a la misión del Banco de
            Alimentos de Durango.
          </p>

          {/* Stats inline */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} weight="bold" className="text-gray-400" />
              <strong className="font-bold text-gray-900">{totals.donor_count}</strong>{" "}
              {totals.donor_count === 1 ? "donante" : "donantes"}
            </span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <HeartStraight size={16} weight="fill" className="text-rose-500" />
              <strong className="font-bold text-gray-900">{formatMxn(totals.raised_cents)}</strong>{" "}
              recaudados
            </span>
          </div>
        </div>

        {/* ── Donor list ────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
          {donors.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-500">
                Aún no hay donantes públicos.
              </p>
              <Link
                href="/donar"
                className="mt-5 inline-flex rounded-full bg-brand-yellow px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Sé el primero en donar
              </Link>
            </div>
          ) : (
            <ol className="divide-y divide-gray-100">
              {donors.map((d, i) => {
                const ini = initials(d.display_name);
                const rank = i + 1;
                const isTop3 = rank <= 3;
                return (
                  <li key={i} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:h-8 sm:w-8 sm:text-sm ${
                        isTop3
                          ? "bg-brand-yellow text-[#451703]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 sm:h-11 sm:w-11 sm:text-base">
                      {ini ?? "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                        {d.display_name ?? "Anónimo"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {daysSince(d.updated_at)} días
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums text-gray-900 sm:text-base">
                      {formatMxn(d.total_donated_cents)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* ── Bottom CTA ────────────────────────────────────────────── */}
        {donors.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/donar"
              className="inline-flex rounded-full bg-brand-yellow px-8 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-base"
            >
              Únete a la lista
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
