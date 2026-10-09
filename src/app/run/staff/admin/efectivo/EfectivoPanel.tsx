"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { formatMxn } from "@/lib/donation";
import type { ResumenEfectivo } from "@/lib/run/efectivo";
import { hace } from "@/app/run/overlay/compartido";
import { anularEfectivoAction, cargarEfectivo, sumarEfectivo } from "./actions";

const RAPIDOS = [20, 50, 100, 200, 500, 1000];

export default function EfectivoPanel() {
  const [datos, setDatos] = useState<ResumenEfectivo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [nombre, setNombre] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());
  const [pendiente, start] = useTransition();
  const ocupado = useRef(false); // evita doble toque mientras se guarda
  const nombreRef = useRef<HTMLInputElement>(null);

  const refrescar = useCallback(async () => {
    try {
      setDatos(await cargarEfectivo());
      setError(null);
    } catch {
      setError("No se pudo actualizar. Revisa tu conexión.");
    }
  }, []);

  // Carga inicial + refresco cada 8 s (por si otra persona también está sumando).
  useEffect(() => {
    refrescar();
    const t = setInterval(refrescar, 8000);
    return () => clearInterval(t);
  }, [refrescar]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  function ejecutar(fn: () => Promise<ResumenEfectivo>, alTerminar?: () => void) {
    if (ocupado.current) return;
    ocupado.current = true;
    start(async () => {
      try {
        setDatos(await fn());
        setError(null);
        alTerminar?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      } finally {
        ocupado.current = false;
      }
    });
  }

  // Un monto rápido solo llena el input; luego se escribe el nombre (opcional) y se suma.
  function elegirRapido(pesos: number) {
    setMonto(String(pesos));
    nombreRef.current?.focus();
  }

  const pesosMonto = Number(monto.replace(/,/g, ""));
  const montoValido = Number.isFinite(pesosMonto) && pesosMonto > 0 && pesosMonto <= 100_000_000;

  function enviar() {
    if (!montoValido) return;
    // El nombre se guarda en el mismo campo que antes era la nota.
    ejecutar(() => sumarEfectivo(pesosMonto, nombre.trim()), () => {
      setMonto("");
      setNombre("");
    });
  }

  return (
    <section className="rounded-[20px] border border-white/10 bg-run-card px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Donaciones del evento
          </p>
          <p className="mt-2 break-words font-schabo text-5xl uppercase leading-none text-run-amber sm:text-6xl">
            {datos ? formatMxn(datos.totalCentavos) : "—"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-white/50 sm:block sm:text-right">
          <p>
            Hoy:{" "}
            <span className="font-schabo text-lg uppercase text-white">
              {datos ? formatMxn(datos.hoyCentavos) : "—"}
            </span>
          </p>
          <p className="sm:mt-1">
            {datos?.cantidad ?? 0} {datos?.cantidad === 1 ? "aportación" : "aportaciones"}
          </p>
        </div>
      </div>

      {/* Montos rápidos: llenan el input de monto */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:grid-cols-6">
        {RAPIDOS.map((p) => {
          const activo = pesosMonto === p;
          return (
            <button
              key={p}
              type="button"
              disabled={pendiente}
              onClick={() => elegirRapido(p)}
              className={`rounded-xl border py-3 font-schabo text-xl uppercase transition-colors active:scale-95 disabled:opacity-50 sm:text-2xl ${activo
                  ? "border-run-amber bg-run-amber text-black"
                  : "border-run-amber/40 bg-white/5 text-white hover:bg-run-amber hover:text-black"
                }`}
            >
              ${p.toLocaleString("es-MX")}
            </button>
          );
        })}
      </div>

      {/* Monto + nombre (opcional) + sumar */}
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <input
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          disabled={pendiente}
          placeholder="Monto (pesos)"
          aria-label="Monto en pesos"
          className="w-full min-w-0 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-run-amber focus:outline-none disabled:opacity-50 sm:flex-1"
        />
        <input
          ref={nombreRef}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
          disabled={pendiente}
          placeholder="Nombre (opcional)"
          aria-label="Nombre del donante (opcional)"
          className="w-full min-w-0 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-run-amber focus:outline-none disabled:opacity-50 sm:flex-1"
        />
        <button
          type="submit"
          disabled={pendiente || !montoValido}
          className="w-full rounded-xl bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-40 sm:w-auto"
        >
          Sumar
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {/* Últimas capturas, con opción de anular si hubo error */}
      <div className="mt-5">
        <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
          Últimas capturas
        </p>
        <ul className="mt-2 divide-y divide-white/10">
          {datos?.recientes.length === 0 && (
            <li className="py-3 text-sm text-white/40">Aún no hay donaciones del evento.</li>
          )}
          {datos?.recientes.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-schabo text-xl uppercase leading-none text-white">
                  {formatMxn(r.centavos)}
                  {r.nombre ? (
                    <span className="ml-2 font-sans text-sm normal-case text-white/70">
                      {r.nombre}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 truncate text-xs text-white/40">
                  {hace(r.creadoEn, ahora)}
                  {r.creadoPor ? ` · ${r.creadoPor}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => {
                  if (confirm(`¿Anular ${formatMxn(r.centavos)}? Se restará del total.`)) {
                    ejecutar(() => anularEfectivoAction(r.id));
                  }
                }}
                className="shrink-0 rounded-lg border border-white/15 px-3 py-2 font-geist-mono text-[10px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-red-400/60 hover:text-red-400 disabled:opacity-40"
              >
                Anular
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}