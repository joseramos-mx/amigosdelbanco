"use client";

import { useState } from "react";

type Pendiente = {
  orden_id: string;
  folio: string;
  correo_comprador: string;
  nombre_comprador: string;
  tokens: string[];
};

export default function ReenvioLigasPanel() {
  const [estado, setEstado] = useState<"listo" | "cargando_lista" | "confirmando" | "enviando">("listo");
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revisarPendientes() {
    setEstado("cargando_lista");
    setError(null);
    setMensaje(null);
    try {
      const res = await fetch("/api/run/reenvio-ligas");
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "No se pudo obtener la lista");
      
      if (datos.pendientes.length === 0) {
        setMensaje("No hay compradores pendientes por activar sus datos.");
        setEstado("listo");
        return;
      }
      
      setPendientes(datos.pendientes);
      setSeleccionados(new Set(datos.pendientes.map((p: Pendiente) => p.orden_id)));
      setEstado("confirmando");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
      setEstado("listo");
    }
  }

  async function confirmarEnvio() {
    setEstado("enviando");
    setError(null);
    try {
      const res = await fetch("/api/run/reenvio-ligas", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenIds: Array.from(seleccionados) })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "Ocurrió un error al enviar correos");
      
      setMensaje(`Se enviaron correos a ${datos.enviados} compradores (${datos.fallidos} fallidos).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setEstado("listo");
      setPendientes([]);
      setSeleccionados(new Set());
    }
  }

  function cancelar() {
    setEstado("listo");
    setPendientes([]);
    setSeleccionados(new Set());
  }

  function toggleSeleccion(ordenId: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(ordenId)) next.delete(ordenId);
      else next.add(ordenId);
      return next;
    });
  }

  function toggleTodos() {
    if (seleccionados.size === pendientes.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(pendientes.map(p => p.orden_id)));
    }
  }

  return (
    <section>
      <h2 className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        Correos de Activación
      </h2>
      <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-4">
        <p className="text-sm text-white">Reenviar correos para llenar datos</p>
        <p className="mt-1 text-xs leading-relaxed text-white/40">
          Reenvía el correo de activación a todos los compradores que ya pagaron pero que aún no han llenado los datos de sus corredores (responsiva, tallas, etc).
        </p>
        <button
          onClick={revisarPendientes}
          disabled={estado !== "listo"}
          className="mt-4 rounded-md border border-white/15 bg-transparent px-5 py-2.5 text-sm uppercase tracking-wide text-white transition-colors hover:border-white/30 disabled:opacity-50"
        >
          {estado === "cargando_lista" ? "Buscando..." : "Revisar pendientes"}
        </button>

        {mensaje && <p className="mt-3 text-sm text-emerald-300">{mensaje}</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {estado === "confirmando" || estado === "enviando" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={estado === "enviando" ? undefined : cancelar}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-run-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-schabo text-3xl uppercase leading-none text-white">
              Compradores Pendientes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Se encontraron {pendientes.length} compradores que no han llenado sus datos. ¿Deseas enviarles el correo de activación ahora?
            </p>

            <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-white/5 bg-black/20">
              <table className="w-full text-left text-sm text-white/70">
                <thead className="sticky top-0 border-b border-white/10 bg-run-card/95 font-geist-mono text-[10px] uppercase tracking-wider backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={pendientes.length > 0 && seleccionados.size === pendientes.length}
                        onChange={toggleTodos}
                        className="rounded border-white/20 bg-transparent"
                      />
                    </th>
                    <th className="px-4 py-3">Folio</th>
                    <th className="px-4 py-3">Comprador</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3 text-center">Faltantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendientes.map((p) => (
                    <tr 
                      key={p.orden_id} 
                      className={`hover:bg-white/5 cursor-pointer ${seleccionados.has(p.orden_id) ? "bg-white/5" : ""}`}
                      onClick={() => toggleSeleccion(p.orden_id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={seleccionados.has(p.orden_id)}
                          onChange={() => toggleSeleccion(p.orden_id)}
                          className="rounded border-white/20 bg-transparent"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-white">{p.folio}</td>
                      <td className="px-4 py-3">{p.nombre_comprador || "Sin nombre"}</td>
                      <td className="px-4 py-3">{p.correo_comprador}</td>
                      <td className="px-4 py-3 text-center text-run-amber font-bold">
                        {p.tokens.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-shrink-0 justify-end gap-3">
              <button
                type="button"
                onClick={cancelar}
                disabled={estado === "enviando"}
                className="rounded-md border border-white/15 px-4 py-2 text-sm uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEnvio}
                disabled={estado === "enviando" || seleccionados.size === 0}
                className="rounded-md bg-run-amber px-4 py-2 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {estado === "enviando" ? "Enviando..." : `Enviar correos (${seleccionados.size})`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
