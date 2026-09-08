import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { hasStripeKey, stripe } from "@/lib/stripe";
import { db, enTransaccion } from "@/lib/db";
import { aplicarTransicionOrden, type EstadoOrden } from "@/lib/run/estados";
import { datosParaActivacion, extenderReserva } from "@/lib/run/inscripciones";
import { enviarLigasActivacion, enviarAlertaDev } from "@/lib/run/correos";
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
  const filas = await db() <{ id: string }[]>`
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
  const t0 = Date.now();
  const transcurrido = () => `${Date.now() - t0}ms`;

  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    console.warn(`[run/webhook][${transcurrido()}] petición sin header stripe-signature`);
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
    console.warn(`[run/webhook][${transcurrido()}] firma inválida: ${mensaje}`);
    return NextResponse.json({ error: `Firma inválida: ${mensaje}` }, { status: 400 });
  }

  console.log(
    `[run/webhook][${transcurrido()}] evento recibido: ${evento.type} (id=${evento.id})`,
  );

  const decision = decidir(evento);
  if (!decision) {
    console.log(`[run/webhook][${transcurrido()}] evento ignorado (no aplica o falta metadata) — id=${evento.id}`);
    return NextResponse.json({ recibido: true, ignorado: true });
  }

  console.log(
    `[run/webhook][${transcurrido()}] decisión tomada: orden=${decision.ordenId} estadoPago=${decision.estadoPago} destinoOrden=${decision.destinoOrden ?? "ninguno"}`,
  );

  try {
    const referencia =
      decision.estadoPago === "pendiente"
        ? await detallesReferencia(decision.paymentIntentId)
        : { numero: null, vence: null };
    console.log(
      `[run/webhook][${transcurrido()}] referencia resuelta (orden=${decision.ordenId})`,
    );

    const { duplicado } = await registrarPago(evento, decision, referencia);
    console.log(
      `[run/webhook][${transcurrido()}] pago registrado (orden=${decision.ordenId}) duplicado=${duplicado}`,
    );
    if (duplicado) {
      return NextResponse.json({ recibido: true, duplicado: true });
    }

    let aplicoElPago = false;
    if (decision.destinoOrden) {
      const resultado = await enTransaccion((tx) =>
        aplicarTransicionOrden(tx, decision.ordenId, decision.destinoOrden!),
      );
      aplicoElPago = resultado.cambio;
      console.log(
        `[run/webhook][${transcurrido()}] transición evaluada (orden=${decision.ordenId}) cambio=${resultado.cambio} ${resultado.cambio
          ? `${resultado.anterior} → ${resultado.nuevo}`
          : `motivo=${resultado.motivo}`
        }`,
      );
      if (!resultado.cambio && resultado.motivo === "no_permitida") {
        console.warn(
          `[run/webhook] transición no permitida ${resultado.actual} → ${decision.destinoOrden} (orden ${decision.ordenId})`,
        );
        if (decision.destinoOrden === "pagada") {
          void enviarAlertaDev({
            asunto: "Pago confirmado contra una orden bloqueada",
            contexto: {
              ordenId: decision.ordenId,
              estadoActual: resultado.actual ?? "desconocido",
              eventoStripeId: evento.id,
              eventoStripeTipo: evento.type,
            },
          });
        }
      }
    }

    // Fuera de la transacción: alargar la reserva a la vigencia real del
    // voucher, para no liberar el cupo de alguien que aún puede pagar.
    if (referencia.vence) {
      await extenderReserva(decision.ordenId, referencia.vence);
      console.log(
        `[run/webhook][${transcurrido()}] reserva extendida (orden=${decision.ordenId}) hasta=${referencia.vence.toISOString()}`,
      );
    }

    // Correo con las ligas de activación, solo cuando el pago se acaba de
    // confirmar. Se hace con await para que el entorno serverless no mate 
    // el proceso antes de que salga el correo. Si Resend falla, el catch
    // evita que el webhook truene (y el pago sigue registrado).
    if (decision.destinoOrden === "pagada" && aplicoElPago) {
      console.log(
        `[run/webhook][${transcurrido()}] iniciando envío de liga de activación (orden=${decision.ordenId})`,
      );
      try {
        const datos = await datosParaActivacion(decision.ordenId);
        console.log(
          `[run/webhook][${transcurrido()}] datosParaActivacion resuelto (orden=${decision.ordenId}) encontrado=${Boolean(datos)}`,
        );
        if (datos) {
          const resultadoCorreo = await enviarLigasActivacion(datos);
          console.log(
            `[run/webhook][${transcurrido()}] enviarLigasActivacion resuelto (orden=${decision.ordenId}) ok=${resultadoCorreo.ok}`,
          );
          if (!resultadoCorreo.ok) {
            console.error(
              `[run/webhook] Resend no pudo enviar la liga (orden ${decision.ordenId}):`,
              resultadoCorreo.error,
            );
            void enviarAlertaDev({
              asunto: "No se pudo enviar la liga de activación",
              contexto: {
                ordenId: decision.ordenId,
                eventoStripeId: evento.id,
                razon: resultadoCorreo.error ?? "desconocida",
              },
            });
          }
        } else {
          // Orden pagada pero sin boletos activables — no debería pasar.
          console.error(
            `[run/webhook] orden pagada sin datos de activación (orden ${decision.ordenId})`,
          );
          void enviarAlertaDev({
            asunto: "Orden pagada sin boletos activables",
            contexto: { ordenId: decision.ordenId, eventoStripeId: evento.id },
          });
        }
      } catch (err) {
        console.error("[run/webhook] no se pudo enviar la liga:", err);
        void enviarAlertaDev({
          asunto: "Excepción al enviar la liga de activación",
          contexto: {
            ordenId: decision.ordenId,
            eventoStripeId: evento.id,
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    // Fase 3 engancha aquí la asignación de dorsales.

    console.log(
      `[run/webhook][${transcurrido()}] terminado sin errores (orden=${decision.ordenId}, evento=${evento.id})`,
    );
    return NextResponse.json({ recibido: true });
  } catch (err) {
    // 500 a propósito: Stripe reintenta y la clave de idempotencia hace que
    // el reintento sea seguro.
    console.error(`[run/webhook][${transcurrido()}] falló (orden=${decision.ordenId}, evento=${evento.id}):`, err);
    void enviarAlertaDev({
      asunto: "Webhook de pagos de la carrera falló (Stripe reintentará)",
      contexto: {
        eventoStripeId: evento.id,
        eventoStripeTipo: evento.type,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}