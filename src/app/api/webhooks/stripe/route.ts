import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, getStripeWebhookSecret } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SessionMetadata = {
  display_name?: string;
  list_public?: string;
  donor_email?: string;
};

async function upsertDonorFromSession(
  email: string,
  meta: SessionMetadata,
  stripeCustomerId: string | null,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("donors")
    .upsert(
      {
        email,
        display_name: meta.display_name || null,
        list_public: meta.list_public === "true",
        stripe_customer_id: stripeCustomerId,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[webhook] upsert donor failed", error);
    return null;
  }
  return data.id;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = (session.metadata ?? {}) as SessionMetadata;
  const email = (session.customer_email ?? meta.donor_email ?? "").toLowerCase();
  if (!email) return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const donorId = await upsertDonorFromSession(email, meta, customerId);
  if (!donorId) return;

  if (session.mode === "subscription" && session.subscription) {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);
    await supabaseAdmin.from("subscriptions").upsert({
      donor_id: donorId,
      stripe_subscription_id: sub.id,
      amount_cents: sub.items.data[0]?.price.unit_amount ?? 0,
      currency: sub.items.data[0]?.price.currency ?? "mxn",
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    }, { onConflict: "stripe_subscription_id" });
    return;
  }

  // mode === 'payment'
  const paid = session.payment_status === "paid";
  if (!paid) {
    // OXXO / SPEI: wait for async_payment_succeeded. Donor row already created.
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  await supabaseAdmin.from("donations").insert({
    donor_id: donorId,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "mxn",
    kind: "once",
    status: "succeeded",
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
  });
}

async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  // Donor row was already created on checkout.session.completed. Insert donation now.
  const meta = (session.metadata ?? {}) as SessionMetadata;
  const email = (session.customer_email ?? meta.donor_email ?? "").toLowerCase();
  if (!email) return;

  const { data: donor } = await supabaseAdmin
    .from("donors")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!donor) return;

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  await supabaseAdmin.from("donations").insert({
    donor_id: donor.id,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "mxn",
    kind: "once",
    status: "succeeded",
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Recurring charge — billing_reason 'subscription_create' is the initial payment;
  // 'subscription_cycle' is each renewal. Both should count.
  if (!invoice.subscription) return;
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("donor_id")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if (!sub) return;

  await supabaseAdmin.from("donations").insert({
    donor_id: sub.donor_id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    kind: "recurring",
    status: "succeeded",
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subId,
  });
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id);
}

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_succeeded":
        await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
