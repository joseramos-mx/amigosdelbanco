import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, getStripeMode, hasStripeKey } from "@/lib/stripe";
import { hayBaseDeDatos, db } from "@/lib/db";
import { registrarDonativo } from "@/lib/donativos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// La paginación de Stripe puede tardar; el trabajo real es corto porque solo
// se corre una vez.
export const maxDuration = 60;

/**
 * Backfill de donativos, ejecutado desde el servidor.
 *
 * Existe porque la llave secreta de Stripe vive en Vercel y no siempre se
 * puede bajar a una máquina — en cuentas de cliente, revelarla o crear una
 * restringida exige verificación que no todos tienen. Corriéndolo aquí, la
 * llave nunca sale de donde ya estaba.
 *
 * Hace lo mismo que scripts/backfill-donativos.mjs, que sigue sirviendo para
 * quien sí tenga llaves locales.
 *
 * Es idempotente: la llave de cada donativo es su PaymentIntent, así que
 * volver a correrlo no duplica. Se puede repetir sin miedo.
 *
 *   curl -X POST https://bancodurango.org/api/admin/backfill \
 *        -H "Authorization: Bearer $CRON_SECRET"
 *
 * Con ?dry=1 solo cuenta, sin escribir.
 */

const MAX_CARGOS = 1000;

function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return request.headers.get("authorization") === `Bearer ${secreto}`;
}

function neto(cargo: Stripe.Charge): number {
  if (cargo.status !== "succeeded" || !cargo.paid) return 0;
  return cargo.amount - (cargo.amount_refunded ?? 0);
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hayBaseDeDatos()) {
    return NextResponse.json({ error: "Falta DATABASE_URL" }, { status: 503 });
  }
  if (!hasStripeKey()) {
    return NextResponse.json({ error: "Falta la llave de Stripe" }, { status: 503 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";

  try {
    const cargos = await stripe.charges
      .list({ limit: 100, expand: ["data.customer"] })
      .autoPagingToArray({ limit: MAX_CARGOS });

    let insertados = 0;
    let omitidos = 0;
    let sinCorreo = 0;

    for (const cargo of cargos) {
      const centavos = neto(cargo);
      if (centavos <= 0) {
        omitidos += 1;
        continue;
      }

      const cliente =
        typeof cargo.customer === "object" && cargo.customer && !cargo.customer.deleted
          ? cargo.customer
          : null;

      const correo = (cliente?.email ?? cargo.billing_details?.email ?? "")
        .trim()
        .toLowerCase();
      if (!correo) {
        sinCorreo += 1;
        continue;
      }

      if (dry) {
        insertados += 1;
        continue;
      }

      const nuevo = await registrarDonativo({
        correo,
        nombre: cliente?.name ?? cargo.billing_details?.name ?? null,
        listaPublica: cliente?.metadata?.list_public === "true",
        stripeCustomerId: cliente?.id ?? null,
        centavos,
        moneda: cargo.currency ?? "mxn",
        tipo: cargo.invoice ? "recurring" : "once",
        // Misma llave que usa el webhook, para que no se dupliquen entre sí.
        paymentIntentId:
          (typeof cargo.payment_intent === "string"
            ? cargo.payment_intent
            : cargo.payment_intent?.id) ?? cargo.id,
        invoiceId: typeof cargo.invoice === "string" ? cargo.invoice : null,
        creadoEn: new Date(cargo.created * 1000),
      });

      if (nuevo) insertados += 1;
      else omitidos += 1;
    }

    const [totales] = await db()<
      { raised_cents: number; donor_count: number; donation_count: number }[]
    >`
      select raised_cents::int as raised_cents, donor_count, donation_count
        from public.totals where id = 1
    `;

    return NextResponse.json({
      modo: getStripeMode(),
      dry,
      cargosRevisados: cargos.length,
      topeAlcanzado: cargos.length >= MAX_CARGOS,
      insertados,
      omitidos,
      sinCorreo,
      totales,
    });
  } catch (err) {
    console.error("[admin/backfill]", err);
    const mensaje = err instanceof Error ? err.message : "desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
