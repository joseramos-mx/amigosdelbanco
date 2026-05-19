import Stripe from "stripe";

// Read STRIPE_MODE to pick which key pair (test vs live) is active.
// Set STRIPE_MODE=test for development, STRIPE_MODE=live for production.
const rawMode = (process.env.STRIPE_MODE ?? "test").toLowerCase();
if (rawMode !== "test" && rawMode !== "live") {
  throw new Error(`Invalid STRIPE_MODE "${rawMode}". Use "test" or "live".`);
}
export const stripeMode = rawMode as "test" | "live";

const secretKey = stripeMode === "live"
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!secretKey) {
  throw new Error(
    `STRIPE_SECRET_KEY_${stripeMode.toUpperCase()} is not set in env. ` +
    `Add it to .env.local or unset STRIPE_MODE to use the default test mode.`,
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Webhook secret matching the active mode. The `stripe listen` CLI gives you
// a test-mode whsec; a webhook endpoint registered in Stripe Dashboard for
// production gives you a separate live-mode whsec.
export const stripeWebhookSecret = stripeMode === "live"
  ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
  : process.env.STRIPE_WEBHOOK_SECRET_TEST;
