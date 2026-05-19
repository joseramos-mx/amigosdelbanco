"use client";

import { useState } from "react";

export default function CuentaForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar el enlace. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Error de red. Verifica tu conexión.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Revisa tu correo</h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
          Si <strong>{email}</strong> tiene una donación con nosotros, te enviamos un
          enlace para gestionarla. Puede tardar un par de minutos en llegar.
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-6 text-sm font-semibold text-brand-blue hover:underline"
        >
          Probar con otro correo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-gray-700">Correo electrónico</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !email}
        className="mt-5 w-full rounded-full bg-brand-yellow px-6 py-4 text-base font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
