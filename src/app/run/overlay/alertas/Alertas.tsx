"use client";

import { useEffect, useState } from "react";
import { formatMxn } from "@/lib/donation";
import type { DonacionOverlay } from "@/lib/run/overlay-donaciones";
import { useDonaciones } from "../useDonaciones";
import { nombreVisible } from "../compartido";

type Props = { clave?: string; demo?: boolean; privado?: boolean; fondo?: boolean };

export default function Alertas({ clave, demo, privado, fondo }: Props) {
  const [cola, setCola] = useState<DonacionOverlay[]>([]);
  const [actual, setActual] = useState<DonacionOverlay | null>(null);

  // Las alertas siempre escuchan TODAS las donaciones, sin importar el filtro de la lista.
  useDonaciones({
    clave,
    demo,
    alcance: "todo",
    limite: 25,
    intervaloMs: 3000,
    onNuevas: (n) => setCola((c) => [...c, ...n].slice(-10)),
  });

  // Saca la siguiente de la cola cuando no hay ninguna en pantalla.
  useEffect(() => {
    if (actual || cola.length === 0) return;
    const [sig, ...resto] = cola;
    setActual(sig);
    setCola(resto);
  }, [actual, cola]);

  // Si se acumulan varias, acorta cada una para no ir atrasados respecto al directo.
  const duracion = cola.length >= 3 ? 4500 : 7000;

  useEffect(() => {
    if (!actual) return;
    const t = setTimeout(() => setActual(null), duracion);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  return (
    <main className="relative h-svh w-full overflow-hidden">
      {fondo && <div className="fixed inset-0 -z-10 bg-black" />}
      <style>{`
        @keyframes alerta-ciclo {
          0%   { transform: translateY(220%); opacity: 0; }
          7%   { transform: translateY(0);    opacity: 1; }
          93%  { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(220%); opacity: 0; }
        }
        @keyframes alerta-brillo {
          0%, 8% { transform: translateX(-100%); }
          28%    { transform: translateX(100%); }
          100%   { transform: translateX(100%); }
        }
      `}</style>

      {/* Contenedor fijo abajo y centrado; la animación vive en el hijo para no chocar con el centrado */}
      <div className="absolute inset-x-0 bottom-[5vmin] flex justify-center px-[2vmin]">
        {actual && (
          <div
            key={actual.id}
            className="w-[min(96vw,58rem)]"
            style={{ animation: `alerta-ciclo ${duracion}ms cubic-bezier(.2,.8,.2,1) both` }}
            role="status"
            aria-live="polite"
          >
            <div className="relative flex items-center drop-shadow-[0_1vmin_2.4vmin_rgba(0,0,0,.55)]">
              {/* Logo a la izquierda, sin círculo, ligeramente superpuesto al óvalo */}
              <div className="relative z-10 -mr-[3.5vmin] h-[11vmin] min-h-[4.2rem] max-h-[6.8rem] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/run/logo.png"
                  alt="Festival de la Generosidad - Social Run"
                  className="h-full w-auto object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                />
              </div>

              {/* Óvalo de la info del donador */}
              <div className="relative flex min-w-0 flex-1 items-center justify-between gap-[2vmin] overflow-hidden rounded-full border-[.5vmin] border-run-amber bg-gradient-to-r from-[#3a2c0e] via-[#262014] to-[#171717] py-[1.1vmin] pl-[5.5vmin] pr-[1.4vmin]">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-[6vmin] -top-[8vmin] h-[20vmin] w-[20vmin] rounded-full bg-run-amber/25 blur-3xl"
                />

                <div className="relative min-w-0">
                  <p className="flex items-center gap-[.9vmin] font-geist-mono text-[clamp(.65rem,1.7vmin,1.1rem)] font-bold uppercase tracking-[0.2em] text-run-amber">
                    <span className="inline-block h-[1.3vmin] w-[1.3vmin] min-h-2 min-w-2 animate-pulse rounded-full bg-run-amber" />
                    Nueva donación · ¡Gracias! 💛
                  </p>
                  <p className="mt-[.4vmin] truncate font-schabo text-[clamp(1.8rem,6vmin,4.4rem)] uppercase leading-none text-white">
                    {nombreVisible(actual.nombre, privado)}
                  </p>
                </div>

                <p className="relative flex h-[7vmin] shrink-0 items-center overflow-hidden rounded-full bg-run-amber px-[2.4vmin] font-schabo text-[clamp(1.8rem,6vmin,4.4rem)] leading-[0.75] text-black">
                  <span className="translate-y-[0.1em]">{formatMxn(actual.centavos)}</span>
                </p>

                {/* brillo que cruza la barra al entrar */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  style={{ animation: `alerta-brillo ${duracion}ms ease-out both` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}