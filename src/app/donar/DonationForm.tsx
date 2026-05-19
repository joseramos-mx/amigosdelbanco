"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HeartStraight,
  User,
  EnvelopeSimple,
  CreditCard,
  Storefront,
  Bank,
  LockKey,
  CheckCircle,
  HandCoins,
  Info,
  Hand,
  Handshake,
  Plant,
  ShoppingBag,
  PuzzlePiece,
  Lightbulb,
  Heartbeat,
  Medal,
  Lightning,
  Feather,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import {
  DONATION_TIERS,
  CUSTOM_TIER_NAME,
  SUGGESTED_DEFAULT_MXN,
  MIN_AMOUNT_MXN,
  calculateStripeFeeCents,
  formatMxn,
  type DonationFrequency,
} from "@/lib/donation";

const SUGGESTED_BADGE_AMOUNT = 500;

const TIER_ICONS: Record<number, PhosphorIcon> = {
  200: Hand,
  300: Handshake,
  400: Plant,
  500: ShoppingBag,
  600: PuzzlePiece,
  800: Lightbulb,
  1000: Heartbeat,
  1500: Medal,
  2000: Lightning,
};

export default function DonationForm() {
  const [frequency, setFrequency] = useState<DonationFrequency>("once");
  const [amountValue, setAmountValue] = useState(String(SUGGESTED_DEFAULT_MXN));
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [listPublic, setListPublic] = useState(true);
  const [coverFee, setCoverFee] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => {
    const n = parseFloat(amountValue.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amountValue]);

  const amountCents = Math.round(amount * 100);
  const feeCents = useMemo(
    () => (amount >= MIN_AMOUNT_MXN ? calculateStripeFeeCents(amountCents) : 0),
    [amount, amountCents],
  );
  const totalCents = amountCents + (coverFee ? feeCents : 0);
  const finalAmountMxn = totalCents / 100;

  const selectedTier = DONATION_TIERS.find((t) => t.amount === amount);
  const currentTierName = selectedTier?.name ?? CUSTOM_TIER_NAME;
  const amountValid = amount >= MIN_AMOUNT_MXN;

  const buttonLabel = !amountValid
    ? `Mínimo $${MIN_AMOUNT_MXN} MXN`
    : frequency === "monthly"
      ? `Donar ${formatMxn(totalCents)}/mes`
      : `Donar ${formatMxn(totalCents)} ahora`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmountMxn,
          frequency,
          email,
          displayName: displayName.trim() || undefined,
          listPublic,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "No pudimos iniciar el pago. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Error de red. Verifica tu conexión.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">

      {/* ── Frequency tabs ─────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1.5">
        <button
          type="button"
          onClick={() => setFrequency("once")}
          className={`rounded-full py-3 text-sm font-bold transition-all ${
            frequency === "once"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Aportar una vez
        </button>
        <button
          type="button"
          onClick={() => setFrequency("monthly")}
          className={`flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all ${
            frequency === "monthly"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mensualmente
          <HeartStraight
            size={16}
            weight={frequency === "monthly" ? "fill" : "regular"}
            className={frequency === "monthly" ? "text-brand-lime" : "text-emerald-500"}
          />
        </button>
      </div>

      {frequency === "monthly" && (
        <p className="-mt-2 mb-5 text-center text-xs font-semibold text-emerald-700">
          Aumenta tu impacto donando cada mes ↑
        </p>
      )}

      {/* ── Tier chips (9 named tiers) ───────────────────────────────── */}
      <fieldset className="mb-7">
        <legend className="mb-3 text-sm font-semibold text-gray-700">
          Categoría de apoyo
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {DONATION_TIERS.map((tier) => {
            const active = selectedTier?.amount === tier.amount;
            const suggested = tier.amount === SUGGESTED_BADGE_AMOUNT;
            const Icon = TIER_ICONS[tier.amount];
            return (
              <button
                key={tier.amount}
                type="button"
                onClick={() => setAmountValue(String(tier.amount))}
                className={`relative rounded-2xl border px-2 py-3 transition-all ${
                  active
                    ? `${tier.activeBg} border-transparent text-white shadow-lg`
                    : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <Icon
                  size={22}
                  weight="fill"
                  className={`mx-auto mb-1 ${active ? "text-white" : tier.iconColor}`}
                />
                <span
                  className={`block text-[10px] font-semibold leading-tight ${
                    active ? "text-white/85" : "text-gray-500"
                  }`}
                >
                  {tier.name}
                </span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums">
                  MX${tier.amount.toLocaleString("es-MX")}
                </span>
                {suggested && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-lime px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-gray-900">
                    <HeartStraight size={9} weight="fill" className="mr-0.5 inline-block align-text-bottom" />
                    Sugerido
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ── Divider: invite custom amount ───────────────────────────── */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-500">
          O escribe tu monto personalizado
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── Big amount input — Ángel guardián tier ─────────────────────── */}
      <div className="mb-6 rounded-2xl bg-gray-50 px-5 py-5 ring-2 ring-transparent transition-colors focus-within:bg-white focus-within:ring-brand-blue/30">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {!selectedTier && (
              <Feather size={14} weight="fill" className="text-brand-yellow" />
            )}
            {selectedTier ? currentTierName : "Escribe el monto que quieras"}
          </span>
          {!selectedTier && amountValid && (
            <span className="rounded-full bg-brand-yellow/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {CUSTOM_TIER_NAME}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <span className="shrink-0 text-2xl font-bold text-gray-400 sm:text-3xl">MX$</span>
          <input
            type="text"
            inputMode="decimal"
            size={1}
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full min-w-0 flex-1 bg-transparent text-3xl font-extrabold tabular-nums text-gray-900 outline-none placeholder:text-gray-300 sm:text-5xl"
          />
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500 ring-1 ring-gray-200">
            MXN
          </span>
        </div>
      </div>

      {/* ── Donor info with icons ──────────────────────────────────────── */}
      <div className="mb-5 grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Tu nombre</span>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20">
            <User size={20} className="shrink-0 text-gray-400" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como quieres aparecer en la lista"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              maxLength={80}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Correo electrónico</span>
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20">
            <EnvelopeSimple size={20} className="shrink-0 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
          <span className="mt-1.5 block text-xs text-gray-400">
            Recibirás tu recibo aquí y podrás gestionar tu donación.
          </span>
        </label>
      </div>

      {/* ── Public toggle ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setListPublic(!listPublic)}
        className={`mb-3 flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
          listPublic
            ? "border-brand-blue/30 bg-brand-blue/5"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <CheckCircle
          size={22}
          weight={listPublic ? "fill" : "regular"}
          className={`mt-0.5 shrink-0 ${listPublic ? "text-brand-blue" : "text-gray-300"}`}
        />
        <span className="text-sm leading-snug text-gray-700">
          <span className="font-bold">Mostrar mi nombre</span> en la lista pública de donantes.
          Si lo desmarcas, aparecerás como Anónimo.
        </span>
      </button>

      {/* ── Cover-the-fee toggle ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setCoverFee(!coverFee)}
        disabled={!amountValid}
        className={`mb-5 flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          coverFee
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${coverFee ? "bg-brand-yellow" : "bg-gray-200"}`}>
          <HandCoins size={14} weight="fill" className={coverFee ? "text-white" : "text-gray-400"} />
        </div>
        <span className="text-sm leading-snug text-gray-700">
          <span className="font-bold">Cubrir la comisión {amountValid ? `(+${formatMxn(feeCents)})` : ""}</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Para que el 100% de tu donación llegue al banco.
          </span>
        </span>
      </button>

      {/* ── Summary breakdown ─────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl bg-gray-50 px-5 py-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
          {frequency === "monthly" ? "Resumen mensual" : "Resumen"}
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-gray-600">Tu donación</dt>
            <dd className="font-semibold tabular-nums text-gray-900">
              {amountValid ? formatMxn(amountCents) : "—"}
            </dd>
          </div>
          {coverFee && amountValid && (
            <div className="flex items-baseline justify-between gap-2 text-gray-500">
              <dt className="inline-flex items-center gap-1">
                Comisión cubierta
                <Info size={13} weight="regular" className="opacity-60" />
              </dt>
              <dd className="font-semibold tabular-nums">+{formatMxn(feeCents)}</dd>
            </div>
          )}
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-gray-200 pt-3">
            <dt className="font-bold text-gray-900">
              Total {frequency === "monthly" ? "mensual" : "hoy"}
            </dt>
            <dd className="text-xl font-extrabold tabular-nums text-gray-900">
              {amountValid ? formatMxn(totalCents) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Recurring disclaimer ──────────────────────────────────────── */}
      {frequency === "monthly" && amountValid && (
        <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          Al donar mensualmente autorizas un cargo recurrente de{" "}
          <strong>{formatMxn(totalCents)}</strong> cada mes hasta que canceles desde{" "}
          <Link href="/cuenta" className="font-bold underline">Mi cuenta</Link>.
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!amountValid || submitting || !email}
        className={`group flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
          frequency === "monthly" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-yellow hover:bg-amber-500"
        }`}
      >
        <HeartStraight size={20} weight="fill" />
        {submitting ? "Conectando con Stripe…" : buttonLabel}
      </button>

      {/* ── ToS micro-link ────────────────────────────────────────────── */}
      <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
        Al continuar aceptas los{" "}
        <Link href="/terminos" className="font-semibold text-gray-600 underline-offset-2 hover:underline">
          Términos
        </Link>{" "}
        y el{" "}
        <Link href="/privacidad" className="font-semibold text-gray-600 underline-offset-2 hover:underline">
          Aviso de privacidad
        </Link>.
      </p>

      {/* ── Payment methods row ────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 pt-5">
        <span className="mr-1 text-xs font-semibold text-gray-400">Aceptamos:</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
          <CreditCard size={13} weight="bold" /> Tarjeta
        </span>
        {frequency === "once" && (
          <>
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              <Storefront size={13} weight="bold" /> OXXO
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              <Bank size={13} weight="bold" /> SPEI
            </span>
          </>
        )}
      </div>

      <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-gray-400">
        <LockKey size={12} weight="bold" />
        Pago seguro procesado por Stripe
      </p>
    </form>
  );
}
