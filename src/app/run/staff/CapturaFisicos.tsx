"use client";

import { useState } from "react";
import { capturarFisicoAction } from "./capturaFisicosActions";

const campo =
  "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
  "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function CapturaFisicos() {
  const [folio, setFolio] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const folioFormat = `GG-${folio.padStart(5, "0")}`;

    const res = await capturarFisicoAction({ folio: folioFormat, nombre, telefono, correo });
    if (res.ok) {
      setSuccess(true);
      setFolio("");
      setNombre("");
      setTelefono("");
      setCorreo("");
    } else {
      setError(res.error || "Error al capturar el folio.");
    }
    setLoading(false);
  };

  return (
    <section className="mt-10">
      <h2 className={etiqueta}>Captura de Boletos Físicos</h2>
      <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-5">
        <p className="text-xs leading-relaxed text-white/40">
          Transcribe aquí los talones de papel que te entreguen los vendedores. Al capturarlos, el
          sistema enviará automáticamente un correo al corredor para que pueda llenar su responsiva
          médica, elegir su talla y descargar su boleto digital.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p className="text-sm text-red-300">{error}</p>}
          {success && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-200">
                Boleto capturado con éxito. El correo de activación ya fue enviado al corredor.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={etiqueta} htmlFor="folioFisico">Folio Físico</label>
              <div className="mt-2 flex rounded-lg border border-white/15 bg-white/5 focus-within:border-run-amber transition-colors">
                <span className="inline-flex items-center pl-4 pr-1 font-geist-mono text-sm text-white/50">
                  GG-
                </span>
                <input
                  id="folioFisico"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="\d+"
                  maxLength={5}
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent py-2.5 pr-4 text-sm font-geist-mono text-white placeholder:text-white/30 focus:outline-none"
                  placeholder="00001"
                />
              </div>
              <p className="mt-1 font-geist-mono text-[9px] uppercase tracking-widest text-white/30">
                Solo ingresa los números.
              </p>
            </div>

            <div>
              <label className={etiqueta} htmlFor="nombreFisico">Nombre Completo</label>
              <input
                id="nombreFisico"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`${campo} mt-2`}
                placeholder="Juan Pérez"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={etiqueta} htmlFor="telefonoFisico">Teléfono</label>
              <input
                id="telefonoFisico"
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={`${campo} mt-2`}
                placeholder="618..."
              />
            </div>

            <div>
              <label className={etiqueta} htmlFor="correoFisico">Correo Electrónico</label>
              <input
                id="correoFisico"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={`${campo} mt-2`}
                placeholder="juan@ejemplo.com"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {loading ? "Capturando..." : "Capturar e Invitar"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
