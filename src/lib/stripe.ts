import Stripe from "stripe";

// Mode toggle: "test" (default) or "live". Picks the matching env var pair.
function resolveMode(): "test" | "live" {
  const raw = (process.env.STRIPE_MODE ?? "test").toLowerCase();
  if (raw !== "test" && raw !== "live") {
    throw new Error(`Invalid STRIPE_MODE "${raw}". Use "test" or "live".`);
  }
  return raw;
}

// Lazy singleton — module-level throws would crash Next.js build phase
// because page data collection imports route handlers eagerly. Instead we
// defer to first API call, so the build only fails if a request actually
// tries to use Stripe without env vars set.
let cached: Stripe | null = null;

function getStripeClient(): Stripe {
  if (cached) return cached;
  const mode = resolveMode();
  const key = mode === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  if (!key) {
    throw new Error(
      `STRIPE_SECRET_KEY_${mode.toUpperCase()} is not set. ` +
      `Add it in Vercel → Project Settings → Environment Variables, or set it in .env.local for dev.`,
    );
  }
  cached = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return cached;
}

// Proxy lets call sites keep using `stripe.charges.list(...)` as before.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripeClient(), prop);
  },
});

export function getStripeMode(): "test" | "live" {
  return resolveMode();
}

/**
 * Whether the secret key for the current mode is configured.
 *
 * Verifying a webhook signature is pure HMAC and needs no API key, but it
 * runs through the lazy client above — so a missing key throws from inside
 * the signature check and a misconfigured server reports itself as "invalid
 * signature". Callers use this to tell the two apart: a bad signature is a
 * 400 (don't retry), a missing key is a 500 (retry once we fix it).
 */
export function hasStripeKey(): boolean {
  const key = resolveMode() === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  return Boolean(key);
}

export function getStripeWebhookSecret(): string | undefined {
  const mode = resolveMode();
  return mode === "live"
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;
}
