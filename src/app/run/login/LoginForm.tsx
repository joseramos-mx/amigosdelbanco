"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

function IconoOjo({ tachado }: { tachado: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
            {tachado && <line x1="2" y1="2" x2="22" y2="22" />}
        </svg>
    );
}

export default function LoginForm() {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

    async function entrar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setEnviando(true);
        setError(null);

        const formulario = e.currentTarget;
        const datos = Object.fromEntries(new FormData(formulario).entries());

        try {
            const res = await fetch("/api/run/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
            });
            const cuerpo = await res.json();
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo iniciar sesión");

            router.push("/run/staff");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Algo salió mal");
            setEnviando(false);
        }
    }

    return (
        <form onSubmit={entrar} className="space-y-4">
            <div>
                <label className={etiqueta} htmlFor="correo">Correo</label>
                <input
                    id="correo"
                    name="correo"
                    type="email"
                    required
                    autoComplete="username"
                    className={`${campo} mt-2`}
                    placeholder="tu@correo.com"
                />
            </div>

            <div>
                <label className={etiqueta} htmlFor="contrasena">Contraseña</label>
                <div className="relative mt-2">
                    <input
                        id="contrasena"
                        name="contrasena"
                        type={mostrarContrasena ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        className={`${campo} pr-11 [&::-ms-reveal]:hidden`}
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarContrasena((v) => !v)}
                        aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={mostrarContrasena}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/40 transition-colors hover:text-run-amber"
                    >
                        <IconoOjo tachado={mostrarContrasena} />
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
            >
                {enviando ? "Entrando…" : "Entrar"}
            </button>
        </form>
    );
}