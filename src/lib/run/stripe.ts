import "server-only";
import type Stripe from "stripe";
import { stripe, getStripeMode } from "@/lib/stripe";
import type { Evento, OrdenCreada, TipoBoleto } from "./inscripciones";

/**
 * Stripe para el módulo de inscripciones.
 *
 * Se reutiliza la misma cuenta y el mismo cliente que /donar — meter una
 * segunda pasarela complica la conciliación y la emisión de CFDI sin ganar
 * nada — pero con endpoint de webhook propio: los eventos de la carrera y
 * los de donativos no comparten handler.
 */

/**
 * Vigencia del voucher OXXO, en días. Cae dentro de las 48–72 h que espera
 * el diseño de la reserva; súbelo y hay que subir también `ttl_reserva_horas`
 * del evento, o el cron libera cupo de gente que todavía puede pagar.
 */
const OXXO_DIAS_VIGENCIA = 3;

/** Tope duro de Stripe: una sesión de Checkout no vive más de 24 h. */
const SESION_MAX_HORAS = 23;

/**
 * Métodos habilitados para la carrera. Card es el único que se da por hecho:
 * OXXO y SPEI (customer_balance) hay que activarlos antes en el Dashboard de
 * Stripe → Settings → Payment methods, para MX. Mandar un método no activado
 * hace fallar la creación de la sesión, así que se configura por entorno:
 *
 *   RUN_METODOS_PAGO="card,oxxo,customer_balance"
 */
export function metodosPago(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const crudo = process.env.RUN_METODOS_PAGO ?? "card";
  const validos = new Set(["card", "oxxo", "customer_balance"]);
  const metodos = crudo
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter((m) => validos.has(m));
  return (metodos.length ? metodos : ["card"]) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
}

export function getRunWebhookSecret(): string | undefined {
  return getStripeMode() === "live"
    ? process.env.STRIPE_RUN_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_RUN_WEBHOOK_SECRET_TEST;
}

type ParamsSesion = {
  evento: Evento;
  tipoBoleto: TipoBoleto;
  cantidad: number;
  orden: OrdenCreada;
  correo: string;
  nombre: string;
  origin: string;
};

/**
 * Crea la sesión de Checkout con la inscripción y el donativo como line
 * items **separados**.
 *
 * Van separados porque son cosas distintas ante el SAT: la inscripción es
 * contraprestación por un servicio y el donativo es deducible. Si viajaran
 * como un solo monto, la separación existiría en la base pero no en el
 * estado de cuenta de Stripe, y la conciliación se cae justo cuando el
 * contador la pide.
 */
export async function crearSesionCheckout(p: ParamsSesion): Promise<Stripe.Checkout.Session> {
  const metodos = metodosPago();

  // customer_balance (SPEI) exige un customer; los demás lo agradecen para
  // conciliar. Se reutiliza por correo, sin tocar la metadata de quien ya
  // exista como donante.
  const previos = await stripe.customers.list({ email: p.correo, limit: 1 });
  const customer =
    previos.data[0] ??
    (await stripe.customers.create({
      email: p.correo,
      name: p.nombre,
      metadata: { origen: "run" },
    }));

  const metadata: Record<string, string> = {
    modulo: "run",
    evento_id: p.evento.id,
    evento_slug: p.evento.slug,
    orden_id: p.orden.id,
    folio: p.orden.folio,
    tipo_boleto_id: p.tipoBoleto.id,
    cantidad: String(p.cantidad),
    monto_inscripcion: String(p.orden.montoInscripcion),
    monto_donativo: String(p.orden.montoDonativo),
  };

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: p.cantidad,
      price_data: {
        currency: "mxn",
        unit_amount: p.tipoBoleto.precio_centavos,
        product_data: {
          name: `Inscripción ${p.evento.nombre} — ${p.tipoBoleto.nombre}`,
          description: "Contraprestación por el servicio. No es deducible de impuestos.",
          metadata: { concepto: "inscripcion", evento_slug: p.evento.slug },
        },
      },
    },
  ];

  if (p.orden.montoDonativo > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "mxn",
        unit_amount: p.orden.montoDonativo,
        product_data: {
          name: "Donativo voluntario — Banco de Alimentos de Durango",
          description: "Aportación deducible, con recibo del donatario autorizado.",
          metadata: { concepto: "donativo", evento_slug: p.evento.slug },
        },
      },
    });
  }

  const expiraSesion = Math.min(
    Math.floor(p.orden.expiraEn.getTime() / 1000),
    Math.floor(Date.now() / 1000) + SESION_MAX_HORAS * 3600,
  );

  const opciones: Stripe.Checkout.SessionCreateParams.PaymentMethodOptions = {};
  if (metodos.includes("oxxo")) {
    opciones.oxxo = { expires_after_days: OXXO_DIAS_VIGENCIA };
  }
  if (metodos.includes("customer_balance")) {
    opciones.customer_balance = {
      funding_type: "bank_transfer",
      bank_transfer: { type: "mx_bank_transfer" },
    };
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    payment_method_types: metodos,
    payment_method_options: Object.keys(opciones).length ? opciones : undefined,
    line_items: lineItems,
    metadata,
    payment_intent_data: { metadata },
    expires_at: expiraSesion,
    success_url: `${p.origin}/run/inscripcion/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${p.origin}/run/inscripcion?cancelado=1`,
    locale: "es",
  });
}

/** Traduce el método de Stripe al enum de la base. */
export function metodoDesdeStripe(tipo: string | null | undefined): "tarjeta" | "oxxo" | "spei" {
  if (tipo === "oxxo") return "oxxo";
  if (tipo === "customer_balance") return "spei";
  return "tarjeta";
}
