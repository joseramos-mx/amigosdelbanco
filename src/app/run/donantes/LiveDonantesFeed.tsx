"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  HandHeart,
  ArrowClockwise,
  Sparkle,
  ArrowLeft,
  Clock,
} from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { formatMxn } from "@/lib/donation";
import type { LiveDonation } from "@/lib/queries";

interface LiveDonantesFeedProps {
  initialDonations: LiveDonation[];
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase().includes("anónimo")) return "♥";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.substring(0, 2).toUpperCase();
}

function tiempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const segs = Math.max(0, Math.floor(diffMs / 1000));
  if (segs < 45) return "Hace un momento";
  const mins = Math.floor(segs / 60);
  if (mins < 60) return `Hace ${mins} ${mins === 1 ? "min" : "mins"}`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
  const meses = Math.floor(dias / 30);
  return `Hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

function formatoFecha(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function LiveDonantesFeed({
  initialDonations,
}: LiveDonantesFeedProps) {
  const [donations, setDonations] = useState<LiveDonation[]>(initialDonations);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [alertaNueva, setAlertaNueva] = useState<{
    nombre: string;
    monto: number;
  } | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<Date>(new Date());
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "once" | "recurring">("todos");
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const knownIdsRef = useRef<Set<string>>(
    new Set(initialDonations.map((d) => d.id))
  );
  const initialLoadRef = useRef(true);

  const fetchLive = async (esManual = false) => {
    if (esManual) setActualizando(true);
    try {
      const res = await fetch("/api/donantes/live", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.donations) return;

      const incoming: LiveDonation[] = data.donations;
      const newIds = new Set<string>();
      let masRecienteNueva: LiveDonation | null = null;

      incoming.forEach((d) => {
        if (!knownIdsRef.current.has(d.id)) {
          newIds.add(d.id);
          knownIdsRef.current.add(d.id);
          if (!masRecienteNueva) masRecienteNueva = d;
        }
      });

      if (!initialLoadRef.current && newIds.size > 0 && masRecienteNueva) {
        setNewlyAddedIds(newIds);
        const newest = masRecienteNueva as LiveDonation;
        setAlertaNueva({
          nombre: newest.display_name,
          monto: newest.amount_cents,
        });

        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#f97316", "#fb923c", "#fcb51d", "#ffffff"],
            disableForReducedMotion: true,
          });
        } catch {
          // ignora si no está disponible
        }

        setTimeout(() => {
          setNewlyAddedIds(new Set());
          setAlertaNueva(null);
        }, 6000);
      }

      startTransition(() => {
        setDonations(incoming);
        setUltimaSincronizacion(new Date());
      });
    } catch (err) {
      console.error("[LiveDonantesFeed] Error polling:", err);
    } finally {
      if (esManual) setActualizando(false);
      initialLoadRef.current = false;
    }
  };

  useEffect(() => {
    initialLoadRef.current = false;
    const interval = setInterval(() => {
      fetchLive(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const donacionesFiltradas = donations.filter((d) => {
    if (filtroTipo === "todos") return true;
    return d.kind === filtroTipo;
  });

  return (
    <main className="min-h-screen bg-[#FFFDF9] text-gray-950 px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* ── Barra Superior de Navegación ────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between border-b border-orange-200/50 pb-4">
          <Link
            href="/run"
            className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:border-orange-400 hover:text-orange-600 sm:text-sm"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Volver al Social Run</span>
          </Link>

          <Link href="/" aria-label="Banco de Alimentos de Durango" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Banco de Alimentos de Durango"
              className="h-8 w-auto transition-opacity hover:opacity-80"
            />
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            <span className="hidden sm:inline">En vivo</span>
            <button
              onClick={() => fetchLive(true)}
              disabled={actualizando}
              className="inline-flex items-center gap-1 text-orange-600 transition-opacity hover:opacity-80 disabled:opacity-50"
              title="Actualizar ahora"
            >
              <ArrowClockwise
                size={14}
                weight="bold"
                className={actualizando ? "animate-spin" : ""}
              />
              <span className="text-[11px] underline">Refrescar</span>
            </button>
          </div>
        </div>

        {/* ── Encabezado Principal ───────────────────────────────────── */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 shadow-xs">
            <Sparkle size={14} weight="fill" className="text-orange-500" />
            Actualización en Vivo
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl md:text-5xl">
            Historial de <span className="text-orange-600">Donaciones</span>
          </h1>
        </div>

        {/* ── ALERTA DE NUEVA DONACIÓN (Toast / Banner) ─────────────── */}
        <AnimatePresence>
          {alertaNueva && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-6 flex items-center justify-between rounded-2xl border border-orange-300 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 p-4 text-white shadow-lg shadow-orange-500/25 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur-xs">
                  🎉
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
                    ¡Nueva donación recibida hace un momento!
                  </p>
                  <p className="text-sm font-semibold sm:text-base">
                    <span className="underline decoration-white/50 underline-offset-2">
                      {alertaNueva.nombre}
                    </span>{" "}
                    ha donado{" "}
                    <span className="font-extrabold text-white">
                      {formatMxn(alertaNueva.monto)}
                    </span>
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                En vivo
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECCIÓN: TABLA DE DONACIONES EN VIVO ───────────────────── */}
        <section className="mt-8 sm:mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Aportaciones Registradas
              </h2>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-orange-700">
                {donacionesFiltradas.length}
              </span>
            </div>

            {/* Filtros de Tipo */}
            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setFiltroTipo("todos")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filtroTipo === "todos"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo("once")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filtroTipo === "once"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Únicas
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo("recurring")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filtroTipo === "recurring"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mensuales
              </button>
            </div>
          </div>

          {/* ── Contenedor de la Tabla ─────────────────────────────────── */}
          <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm">
            {donacionesFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <HandHeart size={28} weight="fill" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">
                  No hay donaciones registradas en este filtro
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
                  Sé de las primeras personas en figurar en el muro oficial de apoyo al Banco de Alimentos.
                </p>
                <Link
                  href="/donar"
                  className="mt-5 inline-flex rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Hacer la primera donación
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  {/* Encabezado de la tabla: DONANTE, MONTO, TIEMPO en ese orden */}
                  <thead className="border-b border-gray-200/80 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th scope="col" className="py-3.5 pr-4 pl-6 sm:pl-8">
                        Donante
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right sm:text-center">
                        Monto
                      </th>
                      <th scope="col" className="py-3.5 pr-6 pl-4 text-right sm:pr-8">
                        Tiempo
                      </th>
                    </tr>
                  </thead>

                  {/* Cuerpo de la tabla */}
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence initial={false}>
                      {donacionesFiltradas.map((d) => {
                        const esNueva = newlyAddedIds.has(d.id);
                        const esAnonimo = d.display_name.toLowerCase().includes("anónimo");
                        const avatarLetter = initials(d.display_name);

                        return (
                          <motion.tr
                            key={d.id}
                            initial={{ opacity: 0, y: -20, backgroundColor: "#ffedd5" }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              backgroundColor: esNueva ? "#ffedd5" : "rgba(255, 255, 255, 1)",
                            }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`group transition-colors ${
                              esNueva
                                ? "bg-orange-100/70 font-medium"
                                : "hover:bg-orange-50/30"
                            }`}
                          >
                            {/* 1. Columna: DONANTE */}
                            <td className="py-4 pr-4 pl-6 sm:pl-8">
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                                    esAnonimo
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                  }`}
                                >
                                  {avatarLetter}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-bold text-gray-900 sm:text-base">
                                      {d.display_name}
                                    </p>
                                    {esNueva && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white animate-pulse">
                                        ¡Nueva!
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Columna: MONTO */}
                            <td className="px-4 py-4 text-right sm:text-center">
                              <span className="text-base font-extrabold tabular-nums text-gray-900 group-hover:text-orange-600 sm:text-lg">
                                {formatMxn(d.amount_cents)}
                              </span>
                              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                MXN
                              </span>
                            </td>

                            {/* 3. Columna: TIEMPO */}
                            <td className="py-4 pr-6 pl-4 text-right sm:pr-8">
                              <div className="flex items-center justify-end gap-1.5 font-medium text-gray-700 text-xs sm:text-sm">
                                <Clock size={13} className="text-gray-400" />
                                <span suppressHydrationWarning>{tiempoRelativo(d.created_at)}</span>
                              </div>
                              <span suppressHydrationWarning className="block text-[11px] text-gray-400">
                                {formatoFecha(d.created_at)}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pie de la tabla */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-xs text-gray-500 sm:flex-row sm:px-8">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span suppressHydrationWarning>
                  Última sincronización:{" "}
                  {mounted
                    ? ultimaSincronizacion.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "--:--:--"}
                </span>
              </div>
              <p className="text-center sm:text-right">
                Las donaciones se registran automáticamente a través de Stripe y el Banco de Alimentos.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────── */}
        <section className="mt-12 text-center">
          <div className="rounded-3xl border border-orange-200/70 bg-gradient-to-b from-orange-50/60 to-white p-7 sm:p-9">
            <h3 className="text-xl font-extrabold text-gray-950 sm:text-2xl">
              ¿Listo para sumar tu nombre a esta causa?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-gray-600 sm:text-sm">
              Con tarjeta de débito, crédito, transferencia SPEI o pago en OXXO.
              Cada aportación hace la diferencia.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/donar"
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                Hacer un donativo
              </Link>
              <Link
                href="/run"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Ir al Social Run 2026
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
