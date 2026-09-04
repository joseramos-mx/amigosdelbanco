"use client";

import { useState } from "react";
import { formatMxn } from "@/lib/donation";

export type OpcionBoleto = {
  id: string;
  nombre: string;
  precioCentavos: number;
  disponibles: number;
};

// Componente reutilizable para los campos con Floating Label
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  required = false,
  min,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        min={min}
        max={max}
        placeholder={placeholder || label}
        className="peer w-full rounded-3xl bg-[#1c1c1c] px-6 pb-2 pt-6 text-sm text-white placeholder-transparent focus:outline-none focus:ring-1 focus:ring-run-amber [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:_textfield]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-6 top-2 text-[10px] text-white/40 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-2 peer-focus:text-[10px]"
      >
        {label}
      </label>
    </div>
  );
}

export default function FormInscripcion({ opciones }: { opciones: OpcionBoleto[] }) {
  const disponibles = opciones.filter((o) => o.disponibles > 0);
  const [tipoId, setTipoId] = useState(disponibles[0]?.id ?? "");
  const [cantidad, setCantidad] = useState<number | "">(1);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [donativo, setDonativo] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para el modal de confirmación
  const [mostrarModal, setMostrarModal] = useState(false);

  const seleccionado = opciones.find((o) => o.id === tipoId);
  const maximo = Math.min(seleccionado?.disponibles ?? 1, 30);
  const cantidadReal = cantidad === "" ? 1 : cantidad;
  const inscripcion = (seleccionado?.precioCentavos ?? 0) * cantidadReal;
  const total = inscripcion + donativo * 100;

  if (!disponibles.length) {
    return (
      <p className="mt-10 rounded-3xl bg-[#1c1c1c] px-6 py-5 text-sm text-white/60">
        El cupo está agotado por ahora. Si se liberan lugares, los anunciamos en la
        página del evento.
      </p>
    );
  }

  function handleSubmitAttempt(e: React.FormEvent) {
    e.preventDefault();
    if (cantidadReal > 3) {
      setMostrarModal(true);
    } else {
      enviar();
    }
  }

  async function enviar() {
    setMostrarModal(false);
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/run/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoBoletoId: tipoId,
          cantidad: cantidadReal,
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
    <>
      <form onSubmit={handleSubmitAttempt} className="space-y-4">
        {opciones.length > 1 && (
          <div className="relative">
            <select
              id="tipo"
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              className="w-full appearance-none rounded-3xl bg-[#1c1c1c] px-6 pb-2 pt-6 text-sm text-white focus:outline-none focus:ring-1 focus:ring-run-amber"
            >
              {disponibles.map((o) => (
                <option key={o.id} value={o.id} className="bg-black">
                  {o.nombre} — {formatMxn(o.precioCentavos)}
                </option>
              ))}
            </select>
            <label htmlFor="tipo" className="pointer-events-none absolute left-6 top-2 text-[10px] text-white/40">
              Boleto
            </label>
          </div>
        )}

        <FloatingInput
          id="nombre"
          label="Nombre y apellidos"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <FloatingInput
          id="correo"
          type="email"
          label="Correo electrónico"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <FloatingInput
            id="cantidad"
            type="number"
            label="Cantidad"
            min={1}
            max={maximo}
            value={cantidad}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
              // Evitar que el primer dígito sea 0
              if (e.key === '0' && cantidad === "") {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setCantidad("");
                return;
              }
              const num = Number(val);
              setCantidad(Math.min(maximo, num));
            }}
          />
          <FloatingInput
            id="telefono"
            type="tel"
            label="Teléfono (opcional)"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div className="rounded-3xl bg-[#1c1c1c] p-6">
          <p className="text-[14px] text-white/90">Suma un donativo</p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/40 max-w-sm">
            Tu inscripción es una contraprestación por el servicio: incluye kit y acceso al evento, y no es deducible. El donativo sí lo es y recibe recibo deducible del Banco de Alimentos de Durango A.C.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[0, 100, 200, 500].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDonativo(m)}
                className={`rounded-full px-5 py-2.5 text-xs transition-colors ${donativo === m ? "bg-run-amber text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
              >
                {m === 0 ? "No donar" : formatMxn(m * 100)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <div>
            <p className="font-schabo text-3xl leading-none text-white">
              Subtotal
              <span className="ml-2">{formatMxn(total)}</span>
            </p>

          </div>
          <button
            type="submit"
            disabled={enviando || !tipoId || cantidad === ""}
            className="rounded-md bg-run-amber px-7 py-3.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {enviando ? "Un momento…" : "Continuar al pago"}
          </button>
        </div>

        {error && (
          <p className="rounded-3xl bg-red-500/10 px-6 py-4 text-sm text-red-200 text-center">
            {error}
          </p>
        )}
      </form>

      {/* Modal de Confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1c1c1c] p-8 text-center">
            <h2 className="font-schabo text-5xl uppercase leading-none text-white">
              ¿Comprar {cantidadReal} accesos?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Estás a punto de iniciar el pago para <strong>{cantidadReal} accesos</strong>.
              Al finalizar, se te enviará una liga especial donde cada miembro de tu equipo deberá registrar sus datos y talla.
            </p>
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviar}
                className="flex-1 rounded-xl bg-run-amber py-3 text-sm font-medium text-black transition-opacity hover:opacity-85"
              >
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

