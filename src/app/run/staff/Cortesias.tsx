"use client";

import { useState } from "react";

type Resultado = {
  folio: string;
  cantidad: number;
  correoEnviado: boolean;
  ligas: string[];
};

const campo =
  "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
  "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function Cortesias() {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function emitir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setResultado(null);

    // Se guarda la referencia antes del await: React limpia currentTarget en
    // cuanto el handler regresa, así que usarlo después da null.
    const formulario = e.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());

    try {
      const res = await fetch("/api/run/cortesias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, cantidad: Number(datos.cantidad) }),
      });
      const cuerpo = await res.json();
      if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo emitir");
      setResultado(cuerpo);
      formulario.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className={etiqueta}>Cortesías</h2>
      <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-5">
        <p className="text-xs leading-relaxed text-white/40">
          Boletos sin cobro para patrocinadores, staff, prensa o pruebas. Ocupan
          cupo como cualquier otro y recorren el mismo flujo: la persona llena
          sus datos, acepta la responsiva y recibe su boleto con QR. Se registran
          con monto cero, así que no inflan lo recaudado.
        </p>

        <form onSubmit={emitir} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={etiqueta} htmlFor="nombre">A nombre de</label>
              <input id="nombre" name="nombre" required className={`${campo} mt-2`} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="correo">Correo</label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                className={`${campo} mt-2`}
                placeholder="ahí llegan las ligas"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <label className={etiqueta} htmlFor="motivo">Motivo</label>
              <input
                id="motivo"
                name="motivo"
                required
                className={`${campo} mt-2`}
                placeholder="Patrocinador Atocha · staff · prueba interna"
              />
            </div>
            <div>
              <label className={etiqueta} htmlFor="cantidad">Cantidad</label>
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                min={1}
                max={50}
                defaultValue={1}
                className={`${campo} mt-2`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando ? "Emitiendo…" : "Emitir cortesía"}
          </button>
        </form>

        {resultado && (
          <div className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-200">
              Listo — folio <strong>{resultado.folio}</strong>, {resultado.cantidad}{" "}
              {resultado.cantidad === 1 ? "boleto" : "boletos"}.{" "}
              {resultado.correoEnviado
                ? "Las ligas ya salieron por correo."
                : "El correo no está configurado; reparte estas ligas a mano:"}
            </p>
            {!resultado.correoEnviado && (
              <ul className="mt-3 space-y-1">
                {resultado.ligas.map((liga) => (
                  <li key={liga}>
                    <a
                      href={liga}
                      className="break-all font-geist-mono text-[11px] text-run-amber underline-offset-4 hover:underline"
                    >
                      {liga}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </section>
  );
}
