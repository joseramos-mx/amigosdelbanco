"use client";

import { useEffect, useState } from "react";
import { VENTA_ABRE_ISO } from "./apertura";

/**
 * Botón inerte con candado y cuenta regresiva a la apertura de la venta.
 *
 * Reemplaza a los `<Link href="/run/inscripcion">` mientras el back se afina.
 * No es un enlace a propósito: el punto es que nadie tropiece con el
 * checkout antes de tiempo aunque el flag `venta_abierta` de la base esté
 * prendido para pruebas.
 *
 * `formato="largo"` muestra `Xd HH:MM:SS` — para la tarjeta principal, donde
 * el segundero se lee como signo de vida. `formato="corto"` muestra `Xd HH:MM`
 * para las píldoras del nav y del pie, donde no cabe más y el segundero
 * marearía. `formato="fecha"` no cuenta: dibuja `19 AGO` — para la pestaña
 * lateral, cuya tipografía vertical hace ilegibles los dos puntos.
 */
export default function BotonBloqueado({
  className = "",
  formato = "largo",
}: {
  className?: string;
  formato?: "largo" | "corto" | "fecha";
}) {
  const objetivo = new Date(VENTA_ABRE_ISO).getTime();
  // Null hasta montar: el servidor no tiene con qué reloj coincidir.
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (formato === "fecha") return;

    let id = 0;
    // Se reengancha al filo del segundo — con setInterval fijo el arranque
    // cae donde caiga y los segundos brincan al azar entre dos lecturas
    // dentro del mismo segundo real.
    const tick = () => {
      setMs(Math.max(0, objetivo - Date.now()));
      const alSiguiente = 1000 - (Date.now() % 1000);
      id = window.setTimeout(tick, alSiguiente);
    };
    tick();
    return () => window.clearTimeout(id);
  }, [objetivo, formato]);

  const texto =
    formato === "fecha"
      ? "Abre 19 AGO"
      : ms === null
        ? "Abre 19 AGO"
        : ms === 0
          ? "Abriendo…"
          : `Abre en ${formatear(ms, formato)}`;

  return (
    <span aria-disabled="true" className={className}>
      <Candado />
      <span className="tabular-nums">{texto}</span>
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatear(ms: number, formato: "largo" | "corto") {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60;
  if (formato === "largo") {
    const s = Math.floor(ms / 1_000) % 60;
    return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${d}d ${pad(h)}:${pad(m)}`;
}

function Candado() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="inline-block h-[0.85em] w-[0.85em] fill-current align-[-0.05em] opacity-75"
    >
      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
    </svg>
  );
}
