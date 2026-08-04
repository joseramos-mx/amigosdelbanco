import type { Metadata } from "next";
import Image from "next/image";
import { HandHeart, HeartStraight, Users } from "@phosphor-icons/react/dist/ssr";
import DonationForm from "./DonationForm";
import { getTotals, getMostRecentDonor } from "@/lib/queries";
import { GOAL_CENTS, formatMxn, percentOfGoal } from "@/lib/donation";

export const metadata: Metadata = {
  title: "Donar — Amigos del Banco de Alimentos",
  description: "Apoya al Banco de Alimentos de Durango con una donación única o mensual.",
};

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export default async function DonarPage() {
  const [totals, recent] = await Promise.all([getTotals(), getMostRecentDonor()]);
  const percent = percentOfGoal(totals.raised_cents);

  const heroContent = (
    <>
      {/* ── Title block ─────────────────────────────────────────────── */}
      <div className="mb-6 text-center md:text-left">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
          <HandHeart size={14} weight="fill" />
          Donar
        </span>
        <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Estamos construyendo <br className="hidden sm:block" />
          <span className="bg-linear-to-r from-amber-500 to-brand-yellow bg-clip-text text-transparent">
            la nueva sede
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base md:max-w-none">
          Tu donación se convierte en metros cuadrados, cámaras de refrigeración
          y transporte para llegar a más familias en Durango. Construyamos juntos
          el banco que merece la región.
        </p>
      </div>

      {/* ── Photo banner + progress card ────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl bg-brand-blue shadow-xl">
        <div className="relative aspect-video w-full">
          <Image
            src="/imagen2.png"
            alt="Voluntarios del Banco de Alimentos Durango"
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-brand-blue/90 via-brand-blue/20 to-transparent" />

          {/* Recent donor chip overlay */}
          {recent && (
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md backdrop-blur sm:left-6 sm:top-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <HeartStraight size={13} weight="fill" className="text-rose-500" />
              <span className="max-w-45 truncate">
                <strong>{recent.display_name}</strong> donó {formatMxn(recent.total_donated_cents)}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{timeAgo(recent.updated_at)}</span>
            </div>
          )}
        </div>

        {/* Progress stats inside same card */}
        <div className="px-5 py-5 text-white sm:px-6">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">
              {formatMxn(totals.raised_cents)}
            </span>
            <span className="text-sm text-white/70">
              meta {formatMxn(GOAL_CENTS)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-brand-lime transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} weight="bold" />
              {totals.donor_count} {totals.donor_count === 1 ? "donante" : "donantes"}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <HeartStraight size={14} weight="fill" className="text-brand-lime" />
              {totals.donation_count} {totals.donation_count === 1 ? "donación" : "donaciones"}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-linear-to-b from-amber-50 via-white to-gray-50 px-5 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">

          {/* ── Hero (mobile: top / desktop: right + sticky) ─────────── */}
          <div className="md:order-2 md:sticky md:top-28">
            {heroContent}
          </div>

          {/* ── Form (mobile: bottom / desktop: left, scrolls) ───────── */}
          <div className="md:order-1">
            <DonationForm />
          </div>

        </div>
      </div>
    </main>
  );
}
