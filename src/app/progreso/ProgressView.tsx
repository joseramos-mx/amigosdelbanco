"use client";

import { motion } from "motion/react";
import {
  Buildings,
  Snowflake,
  Package,
  RoadHorizon,
  Lightning,
  Wrench,
  Truck,
  Gauge,
  CalendarBlank,
  CheckCircle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

type Category = {
  name: string;
  percent: number;
  icon: PhosphorIcon;
  // Tailwind class fragments — written literally so JIT picks them up.
  iconColor: string;
  iconBg: string;
  barColor: string;
};

const CATEGORIES: Category[] = [
  { name: "Nave principal",          percent: 35, icon: Buildings,   iconColor: "text-amber-700",   iconBg: "bg-amber-100",   barColor: "bg-amber-500" },
  { name: "Área de refrigeración",   percent: 5,  icon: Snowflake,   iconColor: "text-sky-700",     iconBg: "bg-sky-100",     barColor: "bg-sky-500" },
  { name: "Área de conservación",    percent: 0,  icon: Package,     iconColor: "text-emerald-700", iconBg: "bg-emerald-100", barColor: "bg-emerald-500" },
  { name: "Pavimentos",              percent: 80, icon: RoadHorizon, iconColor: "text-stone-700",   iconBg: "bg-stone-200",   barColor: "bg-stone-500" },
  { name: "Instalaciones eléctricas", percent: 80, icon: Lightning,   iconColor: "text-amber-700",   iconBg: "bg-amber-100",   barColor: "bg-brand-yellow" },
  { name: "Equipamientos",           percent: 0,  icon: Wrench,      iconColor: "text-violet-700",  iconBg: "bg-violet-100",  barColor: "bg-violet-500" },
  { name: "Transporte",              percent: 0,  icon: Truck,       iconColor: "text-blue-700",    iconBg: "bg-blue-100",    barColor: "bg-brand-blue" },
];

const LAST_UPDATED = "Mayo 2026";

const ease = [0.22, 1, 0.36, 1] as const;

function ProgressBar({ percent, color, delay }: { percent: number; color: string; delay: number }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1.1, ease, delay }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

export default function ProgressView() {
  const overall = Math.round(
    CATEGORIES.reduce((s, c) => s + c.percent, 0) / CATEGORIES.length,
  );
  const completedCount = CATEGORIES.filter((c) => c.percent >= 100).length;
  const inProgressCount = CATEGORIES.filter((c) => c.percent > 0 && c.percent < 100).length;
  const pendingCount = CATEGORIES.filter((c) => c.percent === 0).length;

  return (
    <main className="min-h-screen bg-linear-to-b from-amber-50 via-white to-gray-50 px-5 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-3xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-10 text-center sm:mb-12"
        >
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
            <Gauge size={14} weight="fill" />
            Avanzómetro
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-5xl">
            Construyendo la <br className="hidden sm:block" />
            <span className="bg-linear-to-r from-amber-500 to-brand-yellow bg-clip-text text-transparent">
              nueva sede
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            Cada peso recibido se traduce en metros cuadrados de banco. Mira cómo
            avanza la obra, área por área.
          </p>
        </motion.div>

        {/* ── Overall progress card ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="mb-8 overflow-hidden rounded-3xl bg-brand-blue p-6 text-white shadow-xl sm:p-8"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                Avance general
              </p>
              <p className="mt-1 text-sm text-white/80">
                Promedio de las {CATEGORIES.length} áreas
              </p>
            </div>
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.4 }}
              className="text-4xl font-extrabold tabular-nums sm:text-5xl"
            >
              {overall}%
            </motion.span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overall}%` }}
              transition={{ duration: 1.3, ease, delay: 0.3 }}
              className="h-full rounded-full bg-brand-lime"
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
            <div>
              <p className="text-2xl font-extrabold tabular-nums">{completedCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Completadas
              </p>
            </div>
            <div>
              <p className="text-2xl font-extrabold tabular-nums">{inProgressCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                En curso
              </p>
            </div>
            <div>
              <p className="text-2xl font-extrabold tabular-nums">{pendingCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Pendientes
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Category list ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const delay = 0.3 + i * 0.08;
            const completed = cat.percent >= 100;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay }}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:px-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.iconBg}`}>
                    <Icon size={20} weight="fill" className={cat.iconColor} />
                  </div>
                  <h3 className="flex-1 truncate text-sm font-semibold text-gray-900 sm:text-base">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-sm font-extrabold tabular-nums text-gray-900 sm:text-base">
                    {completed && <CheckCircle size={16} weight="fill" className="text-emerald-500" />}
                    {cat.percent}%
                  </span>
                </div>
                <ProgressBar percent={cat.percent} color={cat.barColor} delay={delay + 0.2} />
              </motion.div>
            );
          })}
        </div>

        {/* ── Footer note ───────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 1.2 }}
          className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400"
        >
          <CalendarBlank size={12} weight="bold" />
          Actualizado en {LAST_UPDATED}
        </motion.p>
      </div>
    </main>
  );
}
