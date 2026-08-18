"use client";

import { useActionState, useEffect, useState } from "react";
import { cambiarContrasenaAction } from "./action";
import { useRouter } from "next/navigation";

export default function FormularioContrasena() {
  const [state, formAction, isPending] = useActionState(cambiarContrasenaAction, null);
  const router = useRouter();

  // Validaciones en tiempo real para la UI
  const [pwd, setPwd] = useState("");
  const [conf, setConf] = useState("");
  
  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const passwordsMatch = pwd === conf && pwd.length > 0;

  useEffect(() => {
    if (state?.success) {
      router.push("/run/staff");
      router.refresh();
    }
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <div className="rounded-xl border border-white/10 bg-run-card p-6 text-center">
        <p className="text-lg text-white">¡Contraseña actualizada con éxito!</p>
        <p className="mt-2 text-white/60">Redirigiendo a tu panel...</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-white/10 bg-run-card p-6">
      <h2 className="font-schabo text-4xl uppercase leading-none text-white">Nueva Contraseña</h2>
      <p className="mt-2 text-sm text-white/60">Ingresa una contraseña segura y fácil de recordar.</p>

      {state?.error && (
        <div className="mt-4 rounded bg-red-500/20 p-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block font-geist-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
            Contraseña
          </label>
          <input
            type="password"
            name="contrasena"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded bg-black/50 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-run-amber"
            placeholder="********"
          />
        </div>

        <div>
          <label className="mb-1 block font-geist-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
            Confirmar Contraseña
          </label>
          <input
            type="password"
            name="confirmacion"
            required
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            className="w-full rounded bg-black/50 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-run-amber"
            placeholder="********"
          />
        </div>
      </div>

      <div className="mt-6 space-y-1 font-geist-mono text-[10px] tracking-wider">
        <p className={hasMinLength ? "text-green-400" : "text-white/40"}>✓ Al menos 8 caracteres</p>
        <p className={hasUpper ? "text-green-400" : "text-white/40"}>✓ Al menos una mayúscula</p>
        <p className={hasLower ? "text-green-400" : "text-white/40"}>✓ Al menos una minúscula</p>
        <p className={hasNumber ? "text-green-400" : "text-white/40"}>✓ Al menos un número</p>
        <p className={hasSymbol ? "text-green-400" : "text-white/40"}>✓ Al menos un símbolo</p>
        <p className={passwordsMatch ? "text-green-400" : "text-white/40"}>✓ Las contraseñas coinciden</p>
      </div>

      <button
        type="submit"
        disabled={isPending || !hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol || !passwordsMatch}
        className="mt-8 w-full rounded bg-run-amber py-3 font-geist-mono text-xs uppercase tracking-widest text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar Contraseña"}
      </button>
    </form>
  );
}
