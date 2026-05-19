import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { MIN_AMOUNT_MXN, MAX_AMOUNT_MXN } from "@/lib/donation";

export const runtime = "nodejs";

type Body = {
  amount: number;              // MXN (pesos, not cents)
  frequency: "once" | "monthly";
  email: string;
  displayName?: string;
  listPublic?: boolean;
};

function validate(body: unknown): { ok: true; value: Body } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_MXN || amount > MAX_AMOUNT_MXN) {
    return { ok: false, error: `Monto debe estar entre $${MIN_AMOUNT_MXN} y $${MAX_AMOUNT_MXN} MXN` };
  }
  if (b.frequency !== "once" && b.frequency !== "monthly") {
    return { ok: false, error: "Frecuencia inválida" };
  }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Correo inválido" };
  }
  const displayName = typeof b.displayName === "string" ? b.displayName.trim().slice(0, 80) : undefined;
  const listPublic = Boolean(b.listPublic);
  return { ok: true, value: { amount, frequency: b.frequency, email, displayName, listPublic } };
}

export async function POST(request: Request) {
  const result = validate(await request.json().catch(() => null));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const { amount, frequency, email, displayName, listPublic } = result.value;
  const amountCents = Math.round(amount * 100);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // Reuse customer if email exists in Stripe, otherwise create.
  const existing = await stripe.customers.list({ email, limit: 1 });
  const customer = existing.data[0] ?? (await stripe.customers.create({
    email,
    name: displayName,
    metadata: { list_public: String(listPublic) },
  }));

  const metadata = {
    display_name: displayName ?? "",
    list_public: String(listPublic),
    donor_email: email,
  };

  const productName = frequency === "monthly"
    ? "Donación mensual — Banco de Alimentos Durango"
    : "Donación — Banco de Alimentos Durango";

  if (frequency === "monthly") {
    // Subscriptions: card only. OXXO/SPEI don't support recurring.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: amountCents,
          recurring: { interval: "month" },
          product_data: { name: productName },
        },
      }],
      subscription_data: { metadata },
      metadata,
      success_url: `${origin}/donar/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donar/cancelado`,
      locale: "es",
    });
    return NextResponse.json({ url: session.url });
  }

  // One-time: card + OXXO + SPEI (customer_balance/mx_bank_transfer).
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    payment_method_types: ["card", "oxxo", "customer_balance"],
    payment_method_options: {
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: { type: "mx_bank_transfer" },
      },
    },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: amountCents,
        product_data: { name: productName },
      },
    }],
    payment_intent_data: { metadata },
    metadata,
    success_url: `${origin}/donar/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/donar/cancelado`,
    locale: "es",
  });
  return NextResponse.json({ url: session.url });
}
