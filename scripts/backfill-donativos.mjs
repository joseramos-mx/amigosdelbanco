/**
 * Backfill de donativos: Stripe → Postgres.
 *
 * Hasta ahora el sitio leía los totales y el muro de donantes en vivo de la
 * API de Stripe. Al pasar las lecturas a Postgres hay que traerse lo que ya
 * existe, o /donantes y /progreso amanecen en cero.
 *
 * Es idempotente: cada donativo se identifica por su PaymentIntent, así que
 * correrlo dos veces no duplica nada. Los agregados (totals, donors) los
 * mantienen los triggers de 0001_init.sql; este script solo inserta filas.
 *
 * Uso:
 *   node --env-file=.env.local scripts/backfill-donativos.mjs [--dry-run]
 *
 * Requiere DATABASE_URL y STRIPE_SECRET_KEY_TEST (o _LIVE con STRIPE_MODE=live).
 */

import postgres from "postgres";
import Stripe from "stripe";

const DRY = process.argv.includes("--dry-run");
const MAX_CARGOS = 1000;

const modo = (process.env.STRIPE_MODE ?? "test").toLowerCase();
const llave = modo === "live" ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY_TEST;

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!llave) throw new Error(`Falta STRIPE_SECRET_KEY_${modo.toUpperCase()}`);

const stripe = new Stripe(llave, { apiVersion: "2025-02-24.acacia" });
const sql = postgres(process.env.DATABASE_URL, { max: 2, prepare: false, onnotice: () => {} });

const neto = (cargo) =>
  cargo.status === "succeeded" && cargo.paid ? cargo.amount - (cargo.amount_refunded ?? 0) : 0;

async function main() {
  console.log(`Leyendo cargos de Stripe (modo ${modo})…`);
  const cargos = await stripe.charges
    .list({ limit: 100, expand: ["data.customer"] })
    .autoPagingToArray({ limit: MAX_CARGOS });

  console.log(`${cargos.length} cargos encontrados.`);

  let insertados = 0;
  let omitidos = 0;
  let sinCorreo = 0;

  for (const cargo of cargos) {
    const centavos = neto(cargo);
    if (centavos <= 0) {
      omitidos += 1;
      continue;
    }

    const cliente = typeof cargo.customer === "object" && cargo.customer && !cargo.customer.deleted
      ? cargo.customer
      : null;

    const correo = (cliente?.email ?? cargo.billing_details?.email ?? "").trim().toLowerCase();
    if (!correo) {
      sinCorreo += 1;
      continue;
    }

    // La llave del donativo: PaymentIntent si existe, si no el propio cargo.
    // Es lo que hace que volver a correr esto no duplique nada.
    const referencia =
      (typeof cargo.payment_intent === "string" ? cargo.payment_intent : cargo.payment_intent?.id) ??
      cargo.id;

    const nombre = cliente?.name ?? cargo.billing_details?.name ?? null;
    const publico = cliente?.metadata?.list_public === "true";
    const tipo = cargo.invoice ? "recurring" : "once";

    if (DRY) {
      console.log(`· ${correo} — ${(centavos / 100).toFixed(2)} MXN — ${referencia}`);
      insertados += 1;
      continue;
    }

    await sql.begin(async (tx) => {
      const [donante] = await tx`
        insert into public.donors (email, display_name, list_public, stripe_customer_id)
        values (${correo}, ${nombre}, ${publico}, ${cliente?.id ?? null})
        on conflict (email) do update
           set display_name       = coalesce(excluded.display_name, public.donors.display_name),
               list_public        = public.donors.list_public or excluded.list_public,
               stripe_customer_id = coalesce(excluded.stripe_customer_id, public.donors.stripe_customer_id),
               updated_at         = now()
        returning id
      `;

      const filas = await tx`
        insert into public.donations (
          donor_id, amount_cents, currency, kind, status,
          stripe_payment_intent_id, stripe_checkout_session_id, stripe_invoice_id, created_at
        ) values (
          ${donante.id}, ${centavos}, ${cargo.currency ?? "mxn"}, ${tipo}, 'succeeded',
          ${referencia}, null,
          ${typeof cargo.invoice === "string" ? cargo.invoice : null},
          ${new Date(cargo.created * 1000)}
        )
        on conflict (stripe_payment_intent_id) do nothing
        returning id
      `;

      if (filas.length) insertados += 1;
      else omitidos += 1;
    });
  }

  const [totales] = await sql`select raised_cents, donor_count, donation_count from public.totals where id = 1`;

  console.log("");
  console.log(`Insertados: ${insertados}`);
  console.log(`Omitidos (ya estaban o sin monto neto): ${omitidos}`);
  if (sinCorreo) console.log(`Sin correo, no se pudieron atribuir: ${sinCorreo}`);
  if (!DRY) {
    console.log("");
    console.log(`Totales en base → recaudado ${(Number(totales.raised_cents) / 100).toFixed(2)} MXN · ` +
      `${totales.donor_count} donantes · ${totales.donation_count} donativos`);
  }
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
