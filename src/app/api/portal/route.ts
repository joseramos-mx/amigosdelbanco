import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendPortalLink } from "@/lib/email";
import { getRedirectOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  // Look up customer in Stripe. We don't leak whether the email is registered —
  // always respond 200 so attackers can't probe email existence.
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0];

  if (customer) {
    const origin = getRedirectOrigin(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/cuenta`,
    });
    const result = await sendPortalLink(email, session.url);
    if (!result.ok) {
      console.error("[portal] email send failed", result.error);
    }
  }

  return NextResponse.json({ ok: true });
}
