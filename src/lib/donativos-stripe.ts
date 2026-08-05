import "server-only";
import { cache } from "react";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { PublicDonor, RecentDonor, Totals } from "@/lib/queries";

/**
 * Lectura de donativos directo de la API de Stripe.
 *
 * Es el camino anterior a tener base de datos, y sigue aquí como respaldo:
 * mientras DATABASE_URL no esté configurada, /donantes y /progreso leen de
 * aquí en lugar de mostrar ceros. En cuanto exista la base, queries.ts deja
 * de llamar a este módulo.
 *
 * No es una segunda fuente de verdad conviviendo con la primera: es la que
 * se usa cuando la primera todavía no existe.
 */

const FALLBACK_TOTALS: Totals = { raised_cents: 0, donor_count: 0, donation_count: 0 };
const MAX_CHARGES = 250;
const MAX_CUSTOMERS = 250;

// Cached underlying Stripe fetches — dedup across all queries in one request.
const getAllCharges = cache(async (): Promise<Stripe.Charge[]> => {
  return stripe.charges.list({ limit: 100 }).autoPagingToArray({ limit: MAX_CHARGES });
});

const getAllCustomers = cache(async (): Promise<Stripe.Customer[]> => {
  return stripe.customers.list({ limit: 100 }).autoPagingToArray({ limit: MAX_CUSTOMERS });
});

function chargeNet(charge: Stripe.Charge): number {
  if (charge.status !== "succeeded" || !charge.paid) return 0;
  return charge.amount - (charge.amount_refunded ?? 0);
}

function customerIdOf(charge: Stripe.Charge): string | null {
  if (!charge.customer) return null;
  return typeof charge.customer === "string" ? charge.customer : charge.customer.id;
}

export const totalesDeStripe = cache(async (): Promise<Totals> => {
  try {
    const charges = await getAllCharges();
    let raised = 0;
    let donations = 0;
    const customers = new Set<string>();

    for (const charge of charges) {
      const net = chargeNet(charge);
      if (net <= 0) continue;
      raised += net;
      donations += 1;
      const id = customerIdOf(charge);
      if (id) customers.add(id);
    }

    return { raised_cents: raised, donor_count: customers.size, donation_count: donations };
  } catch (err) {
    console.error("[getTotals] Stripe query failed:", err);
    return FALLBACK_TOTALS;
  }
});

type CustomerAgg = { total_cents: number; latest_at: number };

function aggregateByCustomer(charges: Stripe.Charge[]): Map<string, CustomerAgg> {
  const agg = new Map<string, CustomerAgg>();
  for (const charge of charges) {
    const net = chargeNet(charge);
    if (net <= 0) continue;
    const id = customerIdOf(charge);
    if (!id) continue;
    const prev = agg.get(id) ?? { total_cents: 0, latest_at: 0 };
    agg.set(id, {
      total_cents: prev.total_cents + net,
      latest_at: Math.max(prev.latest_at, charge.created),
    });
  }
  return agg;
}

export const donantesDeStripe = cache(async (limit = 5): Promise<PublicDonor[]> => {
  try {
    const [charges, customers] = await Promise.all([getAllCharges(), getAllCustomers()]);
    const aggregates = aggregateByCustomer(charges);

    const donors: PublicDonor[] = [];
    for (const customer of customers) {
      const a = aggregates.get(customer.id);
      if (!a) continue;
      if (customer.metadata?.list_public !== "true") continue;
      donors.push({
        display_name: customer.name || null,
        total_donated_cents: a.total_cents,
        updated_at: new Date(a.latest_at * 1000).toISOString(),
      });
    }

    donors.sort((a, b) => b.total_donated_cents - a.total_donated_cents);
    return donors.slice(0, limit);
  } catch (err) {
    console.error("[getPublicDonors] Stripe query failed:", err);
    return [];
  }
});

export const donanteRecienteDeStripe = cache(async (): Promise<RecentDonor | null> => {
  try {
    const [charges, customers] = await Promise.all([getAllCharges(), getAllCustomers()]);
    const aggregates = aggregateByCustomer(charges);
    const customersById = new Map(customers.map((c) => [c.id, c]));

    const sortedRecent = [...charges].sort((a, b) => b.created - a.created);
    for (const charge of sortedRecent) {
      if (chargeNet(charge) <= 0) continue;
      const id = customerIdOf(charge);
      if (!id) continue;
      const customer = customersById.get(id);
      if (!customer || customer.metadata?.list_public !== "true" || !customer.name) continue;
      const a = aggregates.get(id);
      if (!a) continue;
      return {
        display_name: customer.name,
        total_donated_cents: a.total_cents,
        updated_at: new Date(charge.created * 1000).toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error("[getMostRecentDonor] Stripe query failed:", err);
    return null;
  }
});
