import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle,
  HandHeart,
  HeartStraight,
  Receipt,
  ArrowRight,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import HeroClouds from "@/components/HeroClouds";
import ConfettiBurst from "@/components/ConfettiBurst";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "¡Gracias por tu donación!",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ session_id?: string }>;

export default async function ExitoPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id } = await searchParams;

  let amountLabel: string | null = null;
  let isAsync = false;
  let mode: "payment" | "subscription" | "setup" | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      mode = session.mode;
      if (session.amount_total != null) {
        amountLabel = new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: (session.currency ?? "mxn").toUpperCase(),
          maximumFractionDigits: 0,
        }).format(session.amount_total / 100);
      }
      isAsync = session.payment_status === "unpaid";
    } catch {
      // Ignore — show generic thank-you.
    }
  }

  const headline = isAsync
    ? "¡Casi listo!"
    : mode === "subscription"
      ? "¡Bienvenido a la familia!"
      : "¡Gracias de corazón!";

  const subtext = isAsync ? (
    <>
      Recibirás por correo las instrucciones para completar el pago
      {amountLabel ? <> de <strong className="font-extrabold">{amountLabel}</strong></> : null} por OXXO o SPEI.
      Una vez confirmado, aparecerás en la lista de donantes.
    </>
  ) : mode === "subscription" ? (
    <>
      Tu donación mensual{amountLabel ? <> de <strong className="font-extrabold">{amountLabel}</strong></> : null} quedó activa.
      Recibirás un recibo después de cada cobro.
    </>
  ) : (
    <>
      Tu apoyo{amountLabel ? <> de <strong className="font-extrabold">{amountLabel}</strong></> : null} llegará a las
      familias que más lo necesitan en Durango.
    </>
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-brand-blue to-[#0082d8] px-5 pt-28 pb-20 sm:px-6 sm:pt-32">

      {/* ── Sky clouds (same as Hero) ───────────────────────────────── */}
      <HeroClouds />

      {/* ── Confetti burst on every mount ───────────────────────────── */}
      <ConfettiBurst />

      <div className="relative z-10 w-full max-w-md">
        {/* Floating icon above card */}
        <div className="relative mx-auto -mb-8 flex h-24 w-24 items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
            {isAsync ? (
              <Storefront size={48} weight="fill" className="text-rose-500" />
            ) : (
              <HandHeart size={48} weight="fill" className="text-brand-yellow" />
            )}
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-4xl bg-white px-6 pt-16 pb-8 text-center shadow-2xl sm:px-10 sm:pb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <CheckCircle size={14} weight="fill" />
            {isAsync ? "Pago pendiente" : mode === "subscription" ? "Donante mensual" : "Donación completada"}
          </div>

          <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            {headline}
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-600 sm:text-base">
            {subtext}
          </p>

          {/* Receipt note */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
            <Receipt size={14} weight="bold" />
            Te enviamos un recibo a tu correo
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-2.5">
            <Link
              href="/"
              className="group flex items-center justify-center gap-2 rounded-full bg-gray-900 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] sm:text-base"
            >
              Volver al inicio
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/#donantes"
              className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:text-base"
            >
              <HeartStraight size={16} weight="fill" className="text-rose-500" />
              Ver lista de donantes
            </Link>
          </div>
        </div>

        {/* Footer line */}
        <p className="mt-6 text-center text-xs font-semibold text-white/80">
          Banco de Alimentos Durango · contigo cambiamos vidas
        </p>
      </div>
    </main>
  );
}
