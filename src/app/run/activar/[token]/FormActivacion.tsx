"use client";

import { useState } from "react";
import type { Responsiva } from "@/lib/run/responsiva";

const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];
const SEXOS: { valor: "F" | "M" | "X"; etiqueta: string }[] = [
  { valor: "F", etiqueta: "Femenino" },
  { valor: "M", etiqueta: "Masculino" },
  { valor: "X", etiqueta: "Prefiero no decir" },
];

const campo =
  "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white " +
  "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function FormActivacion({
  token,
  responsiva,
  yaActivado,
}: {
  token: string;
  responsiva: Responsiva;
  yaActivado: boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [acepta, setAcepta] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const datos = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch("/api/run/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, token, aceptaResponsiva: acepta }),
      });
      const cuerpo = await res.json();
      if (!res.ok) throw new Error(cuerpo.error ?? "No pudimos guardar tus datos.");
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="mt-10 rounded-lg border border-run-amber/40 bg-run-amber/10 p-6">
        <p className="font-schabo text-3xl uppercase leading-none">Todo listo</p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Guardamos tus datos y te mandamos el boleto por correo. También puedes
          descargarlo aquí mismo.
        </p>
        <a
          href={`/api/run/boleto/${token}/pdf`}
          className="mt-5 inline-block rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
        >
          Descargar mi boleto
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-10 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="nombre">Nombre(s)</label>
          <input id="nombre" name="nombre" required className={`${campo} mt-2`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" required className={`${campo} mt-2`} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="fechaNacimiento">Fecha de nacimiento</label>
          <input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            required
            className={`${campo} mt-2 [color-scheme:dark]`}
          />
          <p className="mt-2 text-xs text-white/35">
            La categoría se calcula con tu edad el día de la carrera.
          </p>
        </div>
        <div>
          <label className={etiqueta} htmlFor="sexo">Sexo</label>
          <select id="sexo" name="sexo" required defaultValue="" className={`${campo} mt-2`}>
            <option value="" disabled className="bg-black">Selecciona</option>
            {SEXOS.map((s) => (
              <option key={s.valor} value={s.valor} className="bg-black">
                {s.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="correo">Correo</label>
          <input id="correo" name="correo" type="email" required className={`${campo} mt-2`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" type="tel" className={`${campo} mt-2`} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="tallaPlayera">Talla de playera</label>
          <select
            id="tallaPlayera"
            name="tallaPlayera"
            required
            defaultValue=""
            className={`${campo} mt-2`}
          >
            <option value="" disabled className="bg-black">Selecciona</option>
            {TALLAS.map((t) => (
              <option key={t} value={t} className="bg-black">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="club">Club o equipo (opcional)</label>
          <input id="club" name="club" className={`${campo} mt-2`} />
        </div>
      </div>

      {/* Lo que pide servicios médicos el día del evento. */}
      <fieldset className="rounded-lg border border-white/15 bg-white/5 p-4">
        <legend className={`${etiqueta} px-2`}>En caso de emergencia</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="contactoEmergNombre">A quién llamamos</label>
            <input
              id="contactoEmergNombre"
              name="contactoEmergNombre"
              required
              className={`${campo} mt-2`}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="contactoEmergTel">Su teléfono</label>
            <input
              id="contactoEmergTel"
              name="contactoEmergTel"
              type="tel"
              required
              className={`${campo} mt-2`}
            />
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="tipoSangre">Tipo de sangre (opcional)</label>
            <input id="tipoSangre" name="tipoSangre" className={`${campo} mt-2`} placeholder="O+" />
          </div>
          <div>
            <label className={etiqueta} htmlFor="condicionesMedicas">
              Condiciones médicas o alergias (opcional)
            </label>
            <input id="condicionesMedicas" name="condicionesMedicas" className={`${campo} mt-2`} />
          </div>
        </div>
      </fieldset>

      {/* Versionada: se guarda cuál aceptaste, cuándo y desde qué IP. */}
      <div className="rounded-lg border border-white/15 bg-white/5 p-4">
        <p className={etiqueta}>{responsiva.titulo}</p>
        {responsiva.borrador && (
          <p className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Texto en borrador, pendiente de revisión legal. No publicar así.
          </p>
        )}
        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-2 text-xs leading-relaxed text-white/55">
          {responsiva.parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-run-amber"
          />
          <span>He leído y acepto la carta responsiva ({responsiva.version}).</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando || !acepta}
        className="w-full rounded-md bg-run-amber py-3.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {enviando ? "Guardando…" : yaActivado ? "Actualizar mis datos" : "Guardar y recibir mi boleto"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}
