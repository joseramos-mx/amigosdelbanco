"use client";

import { useState } from "react";

type Resultado = {
    correo: string;
    rol: "admin" | "escaner";
    contrasenaTemporal: string;
};

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function RegistroStaff() {
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function registrar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        setResultado(null);

        // Se guarda la referencia antes del await: React limpia currentTarget en
        // cuanto el handler regresa, así que usarlo después da null.
        const formulario = e.currentTarget;
        const datos = Object.fromEntries(new FormData(formulario).entries());

        try {
            const res = await fetch("/api/run/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
            });
            const cuerpo = await res.json();
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo registrar");
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
            <h2 className={etiqueta}>Staff</h2>
            <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-5">
                <p className="text-xs leading-relaxed text-white/40">
                    Da de alta a quien necesite entrar al panel o al escáner de kits.
                    El rol <strong className="text-white/60">admin</strong> ve el panel
                    completo; <strong className="text-white/60">escáner</strong> solo
                    puede entregar kits.
                </p>

                <form onSubmit={registrar} className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta} htmlFor="nombre">Nombre</label>
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
                                placeholder="ahí llega su acceso"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                        <div>
                            <label className={etiqueta} htmlFor="puesto">Puesto</label>
                            <input
                                id="puesto"
                                name="puesto"
                                required
                                className={`${campo} mt-2`}
                                placeholder="Encargado de entregas · voluntario"
                            />
                        </div>
                        <div>
                            <label className={etiqueta} htmlFor="rol">Rol</label>
                            <select id="rol" name="rol" defaultValue="escaner" className={`${campo} mt-2`}>
                                <option value="escaner">Escáner</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                        {enviando ? "Registrando…" : "Registrar staff"}
                    </button>
                </form>

                {resultado && (
                    <div className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                        <p className="text-sm text-emerald-200">
                            Listo — <strong>{resultado.correo}</strong> ya puede entrar como{" "}
                            <strong>{resultado.rol === "admin" ? "admin" : "escáner"}</strong>.
                        </p>
                        <p className="mt-2 font-geist-mono text-[11px] text-run-amber">
                            Contraseña temporal: {resultado.contrasenaTemporal}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Compártesela por un canal seguro; se le pedirá cambiarla al entrar.
                        </p>
                    </div>
                )}

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
            </div>
        </section>
    );
}