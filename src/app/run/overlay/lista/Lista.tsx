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

  const etiqueta = alcance === "hoy" ? "Recaudado hoy" : "Recaudado en total";

  return (
    <main className="flex h-svh w-full flex-col p-[2vmin]">
      {fondo && <div className="fixed inset-0 -z-10 bg-black" />}
      <style>{`
        @keyframes fila-entra {
          0%   { transform: translateY(-14px) scale(.98); opacity: 0; }
          100% { transform: translateY(0) scale(1);       opacity: 1; }
        }
      `}</style>

      {/* Tarjeta con color: degradado cálido + borde ámbar + resplandor (nada de caja negra plana) */}
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[4vmin] border-[.6vmin] border-run-amber bg-gradient-to-br from-[#3a2c0e] via-[#262014] to-[#171717] px-[2.5vmin] py-[2vmin] shadow-[0_1.5vmin_5vmin_rgba(0,0,0,.55)]">
        <span aria-hidden className="pointer-events-none absolute -right-[12vmin] -top-[14vmin] h-[48vmin] w-[48vmin] rounded-full bg-run-amber/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-[16vmin] -left-[12vmin] h-[40vmin] w-[40vmin] rounded-full bg-run-amber/10 blur-3xl" />

        {/* Encabezado: logo + total */}
        <header className="relative flex flex-wrap items-center justify-between gap-x-[3vmin] gap-y-[1vmin]">
          <div className="flex min-w-0 items-center gap-[2.2vmin]">
            <div className="grid h-[9vmin] min-h-[3.5rem] w-[9vmin] min-w-[3.5rem] shrink-0 place-items-center rounded-full bg-white p-[1.3vmin] ring-[.6vmin] ring-run-amber">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Banco de Alimentos de Durango" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-[.9vmin] pb-1 font-geist-mono text-[clamp(.7rem,1.7vmin,1.2rem)] font-bold uppercase tracking-[0.2em] text-run-amber">
                <span className="inline-block h-[1.3vmin] w-[1.3vmin] min-h-2 min-w-2 animate-pulse rounded-full bg-run-amber" />
                {etiqueta}
              </p>
              <p className="mt-[.4vmin] font-schabo text-[clamp(2.6rem,9.5vmin,7rem)] uppercase leading-none text-run-amber [text-shadow:0_0_4vmin_rgb(255_190_40/.35)]">
                {datos ? formatMxn(datos.totalCentavos) : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-[1.2vmin]">
            {controles && (
              <div className="flex overflow-hidden rounded-full border border-white/25 font-geist-mono text-[clamp(.7rem,1.7vmin,1.1rem)] uppercase tracking-[0.14em]">
                {(["hoy", "todo"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAlcance(a)}
                    className={`px-[1.8vmin] py-[.9vmin] transition-colors ${
                      alcance === a ? "bg-run-amber text-black" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {a === "hoy" ? "Hoy" : "Histórico"}
                  </button>
                ))}
              </div>
            )}
            <p className="rounded-full bg-white/10 px-[2.2vmin] py-[.8vmin] text-[clamp(1rem,2.8vmin,2rem)] text-white">
              <span className="font-schabo text-[1.3em] uppercase text-run-amber">{datos?.cantidad ?? 0}</span>{" "}
              {datos?.cantidad === 1 ? "donación" : "donaciones"}
            </p>
          </div>
        </header>

        <div className="relative my-[1.4vmin] h-[.4vmin] rounded-full bg-gradient-to-r from-run-amber via-run-amber/40 to-transparent" />

        {/* Lista */}
        <ul className="relative flex min-h-0 flex-1 flex-col overflow-hidden [container-type:size]">
          {datos && datos.recientes.length === 0 && (
            <li className="m-auto text-center text-[clamp(1.1rem,3vmin,2.2rem)] text-white/80">
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
                className={`mb-[1.1cqh] flex h-[8.8cqh] shrink-0 items-center gap-[2.4cqh] rounded-[4.5cqh] border px-[1.6cqh] transition-colors duration-1000 ${
                  nueva
                    ? "border-run-amber bg-run-amber/35"
                    : i === 0
                      ? "border-run-amber/50 bg-white/[0.12]"
                      : "border-white/10 bg-white/[0.07]"
                }`}
                style={nueva ? { animation: "fila-entra .5s cubic-bezier(.2,.8,.2,1) both" } : undefined}
              >
                {/* Inicial del donador */}
                <span className="grid aspect-square h-[78%] shrink-0 place-items-center rounded-full bg-run-amber font-schabo text-[clamp(1.2rem,4.6cqh,3.4rem)] uppercase leading-none text-black">
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
                  <p className="truncate text-[clamp(1.1rem,3.9cqh,3rem)] font-medium leading-tight text-white">
                    {nombre}
                  </p>
                  <p className="font-geist-mono text-[clamp(.65rem,2.2cqh,1.4rem)] uppercase tracking-[0.12em] text-white/75">
                    {hace(d.creadoEn, ahoraMs)}
                  </p>
                </div>

                <p className="shrink-0 font-schabo text-[clamp(1.7rem,5.8cqh,4.4rem)] uppercase leading-none text-run-amber">
                  {formatMxn(d.centavos)}
                </p>
              </li>
            );
          })}
        </ul>

        {!conectado && (
          <p className="relative mt-[1vmin] text-right font-geist-mono text-[clamp(.6rem,1.3vmin,.9rem)] uppercase tracking-[0.16em] text-white/40">
            reconectando…
          </p>
        )}
      </section>
    </main>
  );
}