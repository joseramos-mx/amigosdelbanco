"use client";

import { useState } from "react";

/**
 * Acciones que escriben. Van aparte del panel —que es solo lectura— porque
 * asignar dorsales es irreversible en la práctica: el cronometrista ya recibió
 * el listado y cambiar un número después es un problema en la mesa de kits.
 */
export default function AccionesPanel() {
  const [estado, setEstado] = useState<"listo" | "trabajando">("listo");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function asignar() {
    if (!confirm("¿Asignar dorsales a todos los inscritos que ya llenaron sus datos?")) return;
    setEstado("trabajando");
    setMensaje(null);
    setError(null);
    try {
      const res = await fetch("/api/run/dorsales", { method: "POST" });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "No se pudo");
      const resumen = datos.resultados
        .map((r: { tipo: string; asignados: number; desde: number | null; hasta: number | null }) =>
          r.asignados
            ? `${r.tipo}: ${r.asignados} dorsales (${r.desde}–${r.hasta})`
            : `${r.tipo}: nada pendiente`,
        )
        .join(" · ");
      setMensaje(resumen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setEstado("listo");
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        Acciones
      </h2>
      <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-4">
        <p className="text-sm text-white">Asignar dorsales</p>
        <p className="mt-1 text-xs leading-relaxed text-white/40">
          Reparte números a quienes ya llenaron sus datos y todavía no tienen uno.
          Se corre cuando el padrón está estable, no en cada activación.
        </p>
        <button
          onClick={asignar}
          disabled={estado === "trabajando"}
          className="mt-4 rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {estado === "trabajando" ? "Asignando…" : "Asignar dorsales"}
        </button>

        {mensaje && <p className="mt-3 text-sm text-emerald-300">{mensaje}</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
    </section>
  );
}
