// Color tokens are written as literal strings so Tailwind's JIT picks them up
// at build time. Don't construct them dynamically.
export const DONATION_TIERS = [
  { amount: 200,  name: "Amigo del Banco",      iconColor: "text-orange-500",  activeBg: "bg-orange-500" },
  { amount: 300,  name: "Corazón Solidario",    iconColor: "text-rose-500",    activeBg: "bg-rose-500" },
  { amount: 400,  name: "Semilla Solidaria",    iconColor: "text-emerald-600", activeBg: "bg-emerald-600" },
  { amount: 500,  name: "Canasta de esperanza", iconColor: "text-pink-500",    activeBg: "bg-pink-500" },
  { amount: 600,  name: "Aliado comprometido",  iconColor: "text-blue-500",    activeBg: "bg-blue-500" },
  { amount: 800,  name: "Faro de luz",          iconColor: "text-emerald-800", activeBg: "bg-emerald-800" },
  { amount: 1000, name: "Proveedor de vida",    iconColor: "text-teal-500",    activeBg: "bg-teal-500" },
  { amount: 1500, name: "Embajador",            iconColor: "text-fuchsia-600", activeBg: "bg-fuchsia-600" },
  { amount: 2000, name: "Héroe",                iconColor: "text-amber-800",   activeBg: "bg-amber-800" },
] as const;

export const CUSTOM_TIER_NAME = "Ángel guardián";
export const SUGGESTED_DEFAULT_MXN = 500;

export const MIN_AMOUNT_MXN = 50;
export const MAX_AMOUNT_MXN = 100_000;

export const GOAL_MXN = Number(process.env.NEXT_PUBLIC_DONATION_GOAL_MXN ?? 750_000);
export const GOAL_CENTS = GOAL_MXN * 100;

export type DonationFrequency = "once" | "monthly";

// Stripe MX card processing: 3.6% + $3 MXN per successful charge.
const STRIPE_FEE_PERCENT = 0.036;
const STRIPE_FEE_FIXED_CENTS = 300;

/**
 * Computes the "cover-the-fee" delta so the org nets the full donation amount
 * after Stripe deducts its fee. Uses the gross-up formula:
 *   total = (donation + fixed) / (1 - percent)
 */
export function calculateStripeFeeCents(donationCents: number): number {
  const totalCents = Math.ceil((donationCents + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_PERCENT));
  return totalCents - donationCents;
}

export function formatMxn(cents: number, opts: { decimals?: boolean } = {}): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  }).format(cents / 100);
}

export function percentOfGoal(raisedCents: number): number {
  return Math.min(100, Math.round((raisedCents / GOAL_CENTS) * 100));
}
