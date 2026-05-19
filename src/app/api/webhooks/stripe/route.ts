import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

// v1 source of truth = Stripe. The handler verifies signatures and ACKs;
// reads (totals, leaderboard) go straight to the Stripe API from queries.ts.
// When/if a local DB is added, route the event types below to writers here.

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = getStripeWebhookSecret();
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 });
  }

  // Log the events we care about so we can confirm delivery during testing.
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "invoice.payment_succeeded":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      console.log(`[webhook] ${event.type} received`);
      break;
  }

  return NextResponse.json({ received: true });
}
