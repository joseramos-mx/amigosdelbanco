import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { hasStripeKey, stripe, getStripeWebhookSecret } from "@/lib/stripe";
import {
  datosDesdeMetadata,
  marcarReembolso,
  registrarDonativo,
  registrarSuscripcion,
} from "@/lib/donativos";

export const runtime = "nodejs";

/**
 * Webhook de donativos. Escribe a Postgres, que es de donde leen /donantes y
 * /progreso.
 *
 * Antes esto solo imprimía el evento, porque los totales se calculaban
 * consultando la API de Stripe en cada visita. Con las lecturas ya en
 * Postgres, sin este escritor el sitio se quedaría congelado en la foto del
 * backfill.
 *
 * Todo lo que escribe es idempotente por la referencia de Stripe, así que un
 * reenvío no duplica. Cuando algo falla responde 500 a propósito: Stripe
 * reintenta y la idempotencia hace que el reintento sea seguro.
 */

function idDe(valor: string | { id: string } | null | undefined): string | null {
  if (!valor) return null;
  return typeof valor === "string" ? valor : valor.id;
}

/**
 * Los pagos de la carrera tienen su propio endpoint y sus propias tablas. Si
 * alguien configura un solo endpoint para todo, esto evita que una
 * inscripción —que es contraprestación— termine registrada como donativo
 * deducible.
 */
function esDeLaCarrera(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.modulo === "run";
}

async function procesar(evento: Stripe.Event): Promise<void> {
  switch (evento.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const sesion = evento.data.object as Stripe.Checkout.Session;
      if (esDeLaCarrera(sesion.metadata)) return;

      const datos = datosDesdeMetadata(sesion.metadata, {
        correo: sesion.customer_details?.email,
        nombre: sesion.customer_details?.name,
      });
      const customerId = idDe(sesion.customer as string | { id: string } | null);

      if (sesion.mode === "subscription") {
        // El cobro no viaja aquí: llega en invoice.payment_succeeded, que es
        // donde se registra el donativo. Aquí solo queda el plan.
        const subId = idDe(sesion.subscription as string | { id: string } | null);
        if (!subId || !datos.correo) return;
        await registrarSuscripcion({
          ...datos,
          stripeCustomerId: customerId,
          subscriptionId: subId,
          centavos: sesion.amount_total ?? 0,
          moneda: sesion.currency ?? "mxn",
          estado: "active",
        });
        return;
      }

      if (sesion.payment_status !== "paid") return;

      await registrarDonativo({
        ...datos,
        stripeCustomerId: customerId,
        centavos: sesion.amount_total ?? 0,
        moneda: sesion.currency ?? "mxn",
        tipo: "once",
        paymentIntentId: idDe(sesion.payment_intent as string | { id: string } | null),
        checkoutSessionId: sesion.id,
        creadoEn: new Date(evento.created * 1000),
      });
      return;
    }

    case "invoice.payment_succeeded": {
      // El tipado de Invoice cambió entre versiones de la API; se lee con
      // acceso opcional para no atarse a una en particular.
      const factura = evento.data.object as Stripe.Invoice & {
        subscription?: string | { id: string } | null;
        payment_intent?: string | { id: string } | null;
        subscription_details?: { metadata?: Stripe.Metadata | null } | null;
      };
      const metadata = factura.subscription_details?.metadata ?? null;
      if (esDeLaCarrera(metadata)) return;

      const datos = datosDesdeMetadata(metadata, { correo: factura.customer_email });
      if (!datos.correo) return;

      await registrarDonativo({
        ...datos,
        stripeCustomerId: idDe(factura.customer as string | { id: string } | null),
        centavos: factura.amount_paid ?? 0,
        moneda: factura.currency ?? "mxn",
        tipo: "recurring",
        paymentIntentId: idDe(factura.payment_intent),
        invoiceId: factura.id ?? null,
        subscriptionId: idDe(factura.subscription),
        creadoEn: new Date(evento.created * 1000),
      });
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = evento.data.object as Stripe.Subscription & {
        current_period_end?: number | null;
      };
      if (esDeLaCarrera(sub.metadata)) return;

      const datos = datosDesdeMetadata(sub.metadata);
      if (!datos.correo) return;

      await registrarSuscripcion({
        ...datos,
        stripeCustomerId: idDe(sub.customer as string | { id: string } | null),
        subscriptionId: sub.id,
        centavos: sub.items.data[0]?.price?.unit_amount ?? 0,
        moneda: sub.currency ?? "mxn",
        estado: evento.type === "customer.subscription.deleted" ? "canceled" : sub.status,
        finPeriodo: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
      });
      return;
    }

    case "charge.refunded": {
      const cargo = evento.data.object as Stripe.Charge;
      if (esDeLaCarrera(cargo.metadata)) return;

      const pi = idDe(cargo.payment_intent as string | { id: string } | null);
      if (!pi) return;
      // Se guarda el acumulado, no el reembolso individual: así dos parciales
      // no se descuentan dos veces.
      await marcarReembolso(pi, cargo.amount_refunded ?? 0);
      return;
    }

    default:
      return;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Servidor mal configurado ≠ firma inválida: 500 para que Stripe reintente
  // en vez de dar la entrega por perdida.
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret || !hasStripeKey()) {
    console.error("[webhook] falta STRIPE_WEBHOOK_SECRET_* o la llave secreta de Stripe");
    return NextResponse.json({ error: "Stripe no está configurado" }, { status: 500 });
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
    await procesar(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[webhook] ${event.type} falló:`, err);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
