import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { hasStripeKey, stripe } from "@/lib/stripe";
import { db, enTransaccion } from "@/lib/db";
import { aplicarTransicionOrden, type EstadoOrden } from "@/lib/run/estados";
import { datosParaActivacion, extenderReserva } from "@/lib/run/inscripciones";
import { enviarLigasActivacion } from "@/lib/run/correos";
import { getRunWebhookSecret, metodoDesdeStripe } from "@/lib/run/stripe";

export const runtime = "nodejs";

/**
 * Webhook de pagos de la carrera. Es el **único** lugar que confirma un pago.
 *
 * El retorno del navegador no prueba nada: con OXXO la persona genera su
 * referencia y paga dos días después, en una tienda, sin volver al sitio.
 *
 * Orden estricto de operaciones, en este orden y no en otro:
 *   1. Verificar la firma. Si falla, 400 y no se procesa nada.
 *   2. Insertar el pago con `idempotency_key` única. Si choca, es un reenvío:
 *      200 sin efectos.
 *   3. Aplicar la transición de estado dentro de una transacción.
 *   4. Encolar correos y trabajo lento fuera de la transacción.
 *   5. Responder 200 rápido.
 */

type Decision = {
  ordenId: string;
  eventoId: string;
  estadoPago: "pendiente" | "confirmado" | "fallido" | "reembolsado";
  destinoOrden: EstadoOrden | null;
  metodo: "tarjeta" | "oxxo" | "spei";
  montoCentavos: number;
  paymentIntentId: string | null;
};

function metadataDe(objeto: Stripe.Event.Data.Object): Record<string, string> {
  const conMeta = objeto as { metadata?: Record<string, string> | null };
  return conMeta.metadata ?? {};
}

/** Traduce el evento de Stripe a una decisión, sin tocar la base. */
function decidir(evento: Stripe.Event): Decision | null {
  switch (evento.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const sesion = evento.data.object as Stripe.Checkout.Session;
      const meta = metadataDe(sesion);
      if (meta.modulo !== "run" || !meta.orden_id || !meta.evento_id) return null;

      const metodo = metodoDesdeStripe(sesion.payment_method_types?.[0]);
      const paymentIntentId =
        typeof sesion.payment_intent === "string"
          ? sesion.payment_intent
          : sesion.payment_intent?.id ?? null;
      const montoCentavos = sesion.amount_total ?? 0;
      const base = { ordenId: meta.orden_id, eventoId: meta.evento_id, metodo, montoCentavos, paymentIntentId };

      if (evento.type === "checkout.session.expired") {
        return { ...base, estadoPago: "fallido", destinoOrden: "expirada" };
      }
      if (evento.type === "checkout.session.async_payment_failed") {
        // La orden no se cancela: sigue viva hasta que venza su TTL, por si
        // la persona vuelve a intentar antes del corte.
        return { ...base, estadoPago: "fallido", destinoOrden: null };
      }
      if (evento.type === "checkout.session.async_payment_succeeded") {
        return { ...base, estadoPago: "confirmado", destinoOrden: "pagada" };
      }

      // completed: con tarjeta llega ya pagada; con OXXO o SPEI llega
      // "unpaid" porque apenas se generó la referencia.
      return sesion.payment_status === "paid"
        ? { ...base, estadoPago: "confirmado", destinoOrden: "pagada" }
        : { ...base, estadoPago: "pendiente", destinoOrden: null };
    }

    case "charge.refunded": {
      const cargo = evento.data.object as Stripe.Charge;
      const meta = metadataDe(cargo);
      if (meta.modulo !== "run" || !meta.orden_id || !meta.evento_id) return null;
      return {
        ordenId: meta.orden_id,
        eventoId: meta.evento_id,
        estadoPago: "reembolsado",
        destinoOrden: "reembolsada",
        metodo: metodoDesdeStripe(cargo.payment_method_details?.type),
        montoCentavos: cargo.amount_refunded,
        paymentIntentId: typeof cargo.payment_intent === "string" ? cargo.payment_intent : null,
      };
    }

    default:
      return null;
  }
}

/**
 * Inserta el pago. La clave única es el id del evento de Stripe, así que el
 * segundo y el tercer reenvío del mismo evento chocan aquí y no llegan a
 * tocar la orden.
 *
 * El duplicado se detecta por el `returning` vacío del `on conflict do
 * nothing`, no atrapando la excepción 23505. La diferencia importa: cuando
 * varias entregas simultáneas viajan canalizadas por una misma conexión,
 * Postgres descarta las sentencias posteriores a la que falla hasta el Sync,
 * y esas resuelven vacías en lugar de lanzar. Con el catch, ese handler
 * creía haber insertado y le respondía a Stripe que había aplicado el pago
 * —sin haberlo hecho—. Con `returning`, no hay nada que interpretar: si no
 * volvió fila, alguien más ya registró este evento.
 */
async function registrarPago(
  evento: Stripe.Event,
  d: Decision,
  referencia: { numero: string | null; vence: Date | null },
): Promise<{ duplicado: boolean }> {
  const filas = await db()<{ id: string }[]>`
    insert into public.pago (
      evento_id, orden_id, proveedor, metodo, referencia_externa,
      idempotency_key, monto_centavos, estado, vencimiento_ref,
      payload_crudo, procesado_en
    ) values (
      ${d.eventoId}, ${d.ordenId}, 'stripe', ${d.metodo}::public.metodo_pago,
      ${referencia.numero}, ${evento.id}, ${d.montoCentavos},
      ${d.estadoPago}::public.estado_pago, ${referencia.vence},
      ${JSON.stringify(evento)}::jsonb, now()
    )
    on conflict (idempotency_key) do nothing
    returning id
  `;
  return { duplicado: filas.length === 0 };
}

/**
 * Detalles del voucher OXXO / SPEI. Sirven para dos cosas: enseñarle la
 * referencia a la persona y alargar la reserva de cupo hasta que el voucher
 * de verdad venza.
 */
async function detallesReferencia(
  paymentIntentId: string | null,
): Promise<{ numero: string | null; vence: Date | null }> {
  if (!paymentIntentId) return { numero: null, vence: null };
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const accion = pi.next_action;
    if (accion?.type === "oxxo_display_details" && accion.oxxo_display_details) {
      const d = accion.oxxo_display_details;
      return {
        numero: d.number ?? null,
        vence: d.expires_after ? new Date(d.expires_after * 1000) : null,
      };
    }
    if (accion?.type === "display_bank_transfer_instructions") {
      const d = accion.display_bank_transfer_instructions;
      return { numero: d?.reference ?? null, vence: null };
    }
    return { numero: null, vence: null };
  } catch (err) {
    // No vale la pena tumbar el webhook por esto: el pago ya quedó
    // registrado y la referencia se puede reconstruir del payload crudo.
    console.error("[run/webhook] no se pudo leer la referencia:", err);
    return { numero: null, vence: null };
  }
}

export async function POST(request: Request) {
  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  // Servidor mal configurado ≠ firma inválida. Va 500 para que Stripe
  // reintente cuando esté arreglado, en vez de 400, que da por perdida la
  // entrega y deja la orden pagada sin registrar.
  const secreto = getRunWebhookSecret();
  if (!secreto || !hasStripeKey()) {
    console.error(
      "[run/webhook] falta STRIPE_RUN_WEBHOOK_SECRET_* o la llave secreta de Stripe",
    );
    return NextResponse.json({ error: "Stripe no está configurado" }, { status: 500 });
  }

  const cuerpo = await request.text();
  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "desconocido";
    return NextResponse.json({ error: `Firma inválida: ${mensaje}` }, { status: 400 });
  }

  const decision = decidir(evento);
  if (!decision) return NextResponse.json({ recibido: true, ignorado: true });

  try {
    const referencia =
      decision.estadoPago === "pendiente"
        ? await detallesReferencia(decision.paymentIntentId)
        : { numero: null, vence: null };

    const { duplicado } = await registrarPago(evento, decision, referencia);
    if (duplicado) {
      return NextResponse.json({ recibido: true, duplicado: true });
    }

    let aplicoElPago = false;
    if (decision.destinoOrden) {
      const resultado = await enTransaccion((tx) =>
        aplicarTransicionOrden(tx, decision.ordenId, decision.destinoOrden!),
      );
      aplicoElPago = resultado.cambio;
      if (!resultado.cambio && resultado.motivo === "no_permitida") {
        console.warn(
          `[run/webhook] transición no permitida ${resultado.actual} → ${decision.destinoOrden} (orden ${decision.ordenId})`,
        );
      }
    }

    // Fuera de la transacción: alargar la reserva a la vigencia real del
    // voucher, para no liberar el cupo de alguien que aún puede pagar.
    if (referencia.vence) {
      await extenderReserva(decision.ordenId, referencia.vence);
    }

    // Correo con las ligas de activación, solo cuando el pago se acaba de
    // confirmar. Va después de responder en lo que importa —el estado ya
    // quedó guardado— y sin await bloqueante: si Resend falla, el pago sigue
    // registrado y la liga se puede reenviar a mano.
    if (decision.destinoOrden === "pagada" && aplicoElPago) {
      datosParaActivacion(decision.ordenId)
        .then((datos) => (datos ? enviarLigasActivacion(datos) : null))
        .catch((err) => console.error("[run/webhook] no se pudo enviar la liga:", err));
    }

    // Fase 3 engancha aquí la asignación de dorsales.

    return NextResponse.json({ recibido: true });
  } catch (err) {
    // 500 a propósito: Stripe reintenta y la clave de idempotencia hace que
    // el reintento sea seguro.
    console.error("[run/webhook]", err);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
