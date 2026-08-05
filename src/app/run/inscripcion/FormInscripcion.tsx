"use client";

import { useState } from "react";
import { formatMxn } from "@/lib/donation";

export type OpcionBoleto = {
  id: string;
  nombre: string;
  precioCentavos: number;
  disponibles: number;
};

const campo =
  "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white " +
  "placeholder:text-white/30 focus:border-run-amber focus:outline-none";

const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function FormInscripcion({ opciones }: { opciones: OpcionBoleto[] }) {
  const disponibles = opciones.filter((o) => o.disponibles > 0);
  const [tipoId, setTipoId] = useState(disponibles[0]?.id ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [donativo, setDonativo] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seleccionado = opciones.find((o) => o.id === tipoId);
  const maximo = Math.min(seleccionado?.disponibles ?? 1, 30);
  const inscripcion = (seleccionado?.precioCentavos ?? 0) * cantidad;
  const total = inscripcion + donativo * 100;

  if (!disponibles.length) {
    return (
      <p className="mt-10 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60">
        El cupo está agotado por ahora. Si se liberan lugares, los anunciamos en la
        página del evento.
      </p>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/run/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoBoletoId: tipoId,
          cantidad,
          nombre,
          correo,
          telefono: telefono || undefined,
          donativoMxn: donativo,
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "No pudimos iniciar tu inscripción.");
      window.location.href = datos.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-10 space-y-5">
      {opciones.length > 1 && (
        <div>
          <label className={etiqueta} htmlFor="tipo">Boleto</label>
          <select
            id="tipo"
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value)}
            className={`${campo} mt-2`}
          >
            {disponibles.map((o) => (
              <option key={o.id} value={o.id} className="bg-black">
                {o.nombre} — {formatMxn(o.precioCentavos)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="cantidad">Cantidad</label>
          <input
            id="cantidad"
            type="number"
            min={1}
            max={maximo}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(maximo, Number(e.target.value))))}
            className={`${campo} mt-2`}
          />
          <p className="mt-2 text-xs text-white/35">
            Puedes comprar para tu equipo: cada quien llena sus datos después con su
            propia liga.
          </p>
        </div>
        <div>
          <label className={etiqueta} htmlFor="telefono">Teléfono (opcional)</label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={`${campo} mt-2`}
            placeholder="618 000 0000"
          />
        </div>
      </div>

      <div>
        <label className={etiqueta} htmlFor="nombre">Nombre de quien compra</label>
        <input
          id="nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={`${campo} mt-2`}
          placeholder="Nombre y apellidos"
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="correo">Correo</label>
        <input
          id="correo"
          type="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className={`${campo} mt-2`}
          placeholder="tu@correo.com"
        />
        <p className="mt-2 text-xs text-white/35">
          Aquí llega el comprobante y la liga para llenar los datos de cada corredor.
        </p>
      </div>

      {/* La separación fiscal es visible, no solo interna: la inscripción es
          contraprestación por un servicio y no es deducible; el donativo sí. */}
      <div className="rounded-lg border border-white/15 bg-white/5 p-4">
        <label className={etiqueta} htmlFor="donativo">Suma un donativo (opcional)</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 100, 250, 500].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDonativo(m)}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                donativo === m ? "bg-run-amber text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              {m === 0 ? "Sin donativo" : formatMxn(m * 100)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/40">
          Tu inscripción es una contraprestación por el servicio: incluye kit y
          acceso al evento, y <strong className="text-white/60">no es deducible</strong>.
          El donativo sí lo es y recibe recibo deducible del Banco de Alimentos de
          Durango A.C.
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-5">
        <div>
          <p className="text-sm text-white/50">
            Inscripción {formatMxn(inscripcion)}
            {donativo > 0 && ` + donativo ${formatMxn(donativo * 100)}`}
          </p>
          <p className="font-schabo text-3xl uppercase leading-none">{formatMxn(total)}</p>
        </div>
        <button
          type="submit"
          disabled={enviando || !tipoId}
          className="rounded-md bg-run-amber px-7 py-3.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {enviando ? "Un momento…" : "Continuar al pago"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}
