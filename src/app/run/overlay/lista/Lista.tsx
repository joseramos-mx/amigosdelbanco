"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMxn } from "@/lib/donation";
import type { Alcance } from "@/lib/run/overlay-donaciones";
import { useDonaciones } from "../useDonaciones";
import { hace, nombreVisible } from "../compartido";

type Props = {
  clave?: string;
  alcanceInicial: Alcance;
  /** Muestra el interruptor Hoy / Histórico en pantalla (para OBS > Interactuar). */
  controles?: boolean;
  demo?: boolean;
  privado?: boolean;
  fondo?: boolean;
};

export default function Lista({ clave, alcanceInicial, controles, demo, privado, fondo }: Props) {
  const [alcance, setAlcance] = useState<Alcance>(alcanceInicial);
  const [resaltadas, setResaltadas] = useState<Set<string>>(new Set());

  const resaltar = useCallback((ids: string[]) => {
    setResaltadas((s) => new Set([...s, ...ids]));
    setTimeout(() => {
      setResaltadas((s) => {
        const n = new Set(s);
        ids.forEach((i) => n.delete(i));
        return n;
      });
    }, 3000);
  }, []);

  const { datos, conectado, ahoraMs } = useDonaciones({
    clave,
    demo,
    alcance,
    limite: 10,
    onNuevas: (n) => resaltar(n.map((d) => d.id)),
  });

  // Atajo de teclado: "T" alterna Hoy / Histórico (útil con OBS > Interactuar).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") setAlcance((a) => (a === "hoy" ? "todo" : "hoy"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const etiqueta = alcance === "hoy" ? "Recaudado hoy" : "Recaudado";

  return (
    // Formato "celular": angosto (menos de la mitad de la pantalla) y de altura moderada.
    // Todo se dimensiona con cqw (relativo al ancho de la tarjeta) para que escale parejo.
    <main className="w-[23vw] min-w-[200px] max-w-full p-[1.5vmin] [container-type:inline-size]">
      {fondo && <div className="fixed inset-0 -z-10 bg-black" />}
      <style>{`
        @keyframes fila-entra {
          0%   { transform: translateY(-8px) scale(.98); opacity: 0; }
          100% { transform: translateY(0) scale(1);      opacity: 1; }
        }
      `}</style>

      <section className="relative overflow-hidden rounded-[6cqw] border-[.8cqw] border-run-amber/80 bg-gradient-to-br from-[#3a2c0e]/95 via-[#262014]/95 to-[#171717]/95 p-[4cqw] shadow-[0_2cqw_6cqw_rgba(0,0,0,.45)]">
        <span aria-hidden className="pointer-events-none absolute -right-[20cqw] -top-[22cqw] h-[60cqw] w-[60cqw] rounded-full bg-run-amber/20 blur-3xl" />

        {/* Encabezado: logo + total */}
        <header className="relative flex items-center gap-[3.5cqw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/run/logo.png"
            alt="Banco de Alimentos de Durango"
            className="h-[13cqw] w-auto shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-[1.6cqw] font-geist-mono text-[2.6cqw] font-bold uppercase leading-none tracking-[0.16em] text-run-amber">
              <span className="inline-block h-[2cqw] w-[2cqw] animate-pulse rounded-full bg-run-amber" />
              <span className="truncate">{etiqueta}</span>
            </p>
            <p className="font-schabo text-[11cqw] uppercase leading-none text-run-amber [text-shadow:0_0_4cqw_rgb(255_190_40/.35)] mt-2">
              {datos ? formatMxn(datos.totalCentavos) : "—"}
            </p>
          </div>

          {/* Total de donaciones, del lado derecho */}
          <p className="flex shrink-0 flex-col items-center rounded-[3cqw] bg-white/10 px-[3cqw] py-[1.8cqw] leading-none text-white">
            <span className="font-schabo text-[8cqw] uppercase text-run-amber">{datos?.cantidad ?? 0}</span>
            <span className="mt-[.8cqw] text-[2.6cqw]">{datos?.cantidad === 1 ? "donación" : "donaciones"}</span>
          </p>
        </header>

        {/* Interruptor Hoy / Histórico (solo con controles) */}
        <div className="relative flex justify-end">
          {controles && (
            <div className="mt-[2.5cqw] flex overflow-hidden rounded-full border border-white/25 font-geist-mono text-[2.4cqw] uppercase leading-none tracking-[0.1em]">
              {(["hoy", "todo"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAlcance(a)}
                  className={`px-[2.4cqw] py-[1.2cqw] transition-colors ${alcance === a ? "bg-run-amber text-black" : "text-white/70 hover:text-white"
                    }`}
                >
                  {a === "hoy" ? "Hoy" : "Histórico"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative my-[2.5cqw] h-[.7cqw] rounded-full bg-gradient-to-r from-run-amber via-run-amber/40 to-transparent" />

        {/* Lista */}
        <ul className="relative flex flex-col gap-[1.6cqw]">
          {datos && datos.recientes.length === 0 && (
            <li className="py-[3cqw] text-center text-[3.6cqw] text-white/80">
              Esperando la primera donación…
            </li>
          )}
          {datos?.recientes.map((d, i) => {
            const nombre = nombreVisible(d.nombre, privado);
            const anonimo = !d.nombre?.trim();
            const nueva = resaltadas.has(d.id);
            return (
              <li
                key={d.id}
                className={`flex h-[11cqw] items-center gap-[2.6cqw] rounded-full border px-[1.2cqw] pr-[3.4cqw] transition-colors duration-1000 ${nueva
                  ? "border-run-amber bg-run-amber/35"
                  : i === 0
                    ? "border-run-amber/50 bg-white/[0.12]"
                    : "border-white/10 bg-white/[0.07]"
                  }`}
                style={nueva ? { animation: "fila-entra .5s cubic-bezier(.2,.8,.2,1) both" } : undefined}
              >
                {/* Inicial del donador */}
                <span className="grid aspect-square h-[82%] shrink-0 place-items-center rounded-full bg-run-amber font-schabo text-[5.4cqw] uppercase leading-none text-black">
                  {anonimo ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[52%] w-[52%]"
                      aria-hidden
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                  ) : (
                    <span className="translate-y-[0.06em]">{nombre[0]}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[4.2cqw] font-medium leading-none text-white">{nombre}</p>
                  <p className="mt-[1cqw] font-geist-mono text-[2.3cqw] uppercase leading-none tracking-[0.1em] text-white/70">
                    {hace(d.creadoEn, ahoraMs)}
                  </p>
                </div>

                <p className="shrink-0 font-schabo text-[6.2cqw] uppercase leading-none text-run-amber">
                  {formatMxn(d.centavos)}
                </p>
              </li>
            );
          })}
        </ul>

        {!conectado && (
          <p className="relative mt-[2cqw] text-right font-geist-mono text-[2.2cqw] uppercase tracking-[0.16em] text-white/40">
            reconectando…
          </p>
        )}
      </section>
    </main>
  );
}