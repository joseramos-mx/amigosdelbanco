import "server-only";
import type postgres from "postgres";
import type Stripe from "stripe";
import { db, enTransaccion } from "@/lib/db";

/**
 * Escritura de donativos a Postgres.
 *
 * El webhook de Stripe es el único que llama aquí. Los agregados (`totals`,
 * `donors.total_donated_cents`) los mantienen los triggers de 0001 y 0004,
 * así que estas funciones solo insertan o marcan filas.
 *
 * Todo es idempotente por la referencia de Stripe: un reenvío del mismo
 * evento no duplica nada. Y el duplicado se detecta con `on conflict do
 * nothing returning id`, no atrapando la excepción — cuando varias entregas
 * simultáneas se canalizan por una misma conexión, Postgres descarta las
 * sentencias que siguen a la que falla y esas resuelven vacías en vez de
 * lanzar.
 */

type Cliente = postgres.Sql | postgres.TransactionSql;

type DatosDonante = {
  correo: string;
  nombre?: string | null;
  listaPublica?: boolean;
  stripeCustomerId?: string | null;
};

async function upsertDonante(sql: Cliente, d: DatosDonante): Promise<string> {
  const [fila] = await sql<{ id: string }[]>`
    insert into public.donors (email, display_name, list_public, stripe_customer_id)
    values (${d.correo}, ${d.nombre ?? null}, ${d.listaPublica ?? false},
            ${d.stripeCustomerId ?? null})
    on conflict (email) do update
       set display_name       = coalesce(excluded.display_name, public.donors.display_name),
           -- La preferencia de aparecer en el muro la manda siempre el
           -- formulario más reciente, incluso para desactivarla.
           list_public        = excluded.list_public,
           stripe_customer_id = coalesce(excluded.stripe_customer_id, public.donors.stripe_customer_id),
           updated_at         = now()
    returning id
  `;
  return fila.id;
}

export type Donativo = DatosDonante & {
  centavos: number;
  moneda?: string;
  tipo: "once" | "recurring";
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  creadoEn?: Date;
};

/** Devuelve false si el donativo ya estaba registrado. */
export async function registrarDonativo(d: Donativo): Promise<boolean> {
  if (d.centavos <= 0 || !d.correo) return false;

  return enTransaccion(async (tx) => {
    const donanteId = await upsertDonante(tx, d);

    const filas = await tx<{ id: string }[]>`
      insert into public.donations (
        donor_id, amount_cents, currency, kind, status,
        stripe_payment_intent_id, stripe_checkout_session_id,
        stripe_invoice_id, stripe_subscription_id, created_at
      ) values (
        ${donanteId}, ${d.centavos}, ${d.moneda ?? "mxn"}, ${d.tipo}, 'succeeded',
        ${d.paymentIntentId ?? null}, ${d.checkoutSessionId ?? null},
        ${d.invoiceId ?? null}, ${d.subscriptionId ?? null},
        ${d.creadoEn ?? new Date()}
      )
      -- Sin objetivo: la fila puede chocar por PaymentIntent o por factura,
      -- y cualquiera de los dos significa lo mismo — ya estaba.
      on conflict do nothing
      returning id
    `;
    return filas.length > 0;
  });
}

export type Suscripcion = DatosDonante & {
  subscriptionId: string;
  centavos: number;
  moneda?: string;
  estado: string;
  finPeriodo?: Date | null;
};

export async function registrarSuscripcion(s: Suscripcion): Promise<void> {
  if (!s.correo) return;

  await enTransaccion(async (tx) => {
    const donanteId = await upsertDonante(tx, s);

    await tx`
      insert into public.subscriptions (
        donor_id, stripe_subscription_id, amount_cents, currency, status, current_period_end
      ) values (
        ${donanteId}, ${s.subscriptionId}, ${s.centavos}, ${s.moneda ?? "mxn"},
        ${s.estado}, ${s.finPeriodo ?? null}
      )
      on conflict (stripe_subscription_id) do update
         set amount_cents       = excluded.amount_cents,
             status             = excluded.status,
             current_period_end = excluded.current_period_end,
             updated_at         = now()
    `;
  });
}

/**
 * Marca lo reembolsado de un cargo. El trigger de 0004 resta la diferencia
 * de `donors` y `totals`, así que llamar dos veces con el mismo monto no
 * descuenta dos veces.
 */
export async function marcarReembolso(
  paymentIntentId: string,
  reembolsadoCentavos: number,
): Promise<void> {
  await db()`
    update public.donations
       set refunded_cents = ${reembolsadoCentavos},
           refunded_at    = case when ${reembolsadoCentavos} > 0 then now() else null end
     where stripe_payment_intent_id = ${paymentIntentId}
       and refunded_cents <> ${reembolsadoCentavos}
  `;
}

/** Saca correo, nombre y preferencia de muro de la metadata del checkout. */
export function datosDesdeMetadata(
  metadata: Stripe.Metadata | null | undefined,
  respaldo: { correo?: string | null; nombre?: string | null } = {},
): { correo: string; nombre: string | null; listaPublica: boolean } {
  const m = metadata ?? {};
  const correo = (m.donor_email || respaldo.correo || "").trim().toLowerCase();
  const nombre = (m.display_name || respaldo.nombre || "").trim() || null;
  return { correo, nombre, listaPublica: m.list_public === "true" };
}
