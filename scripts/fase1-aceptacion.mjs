/**
 * Prueba de aceptación de la Fase 1.
 *
 * Verifica las dos cosas que sostienen el cobro:
 *
 *   1. El mismo evento de webhook disparado tres veces deja la orden pagada
 *      una sola vez y el cupo abajo exactamente en uno.
 *   2. Una orden pendiente con TTL vencido no ocupa cupo, y el cron la deja
 *      en `expirada`.
 *
 * Corre contra el servidor de verdad y la base de verdad: no simula el
 * handler, le pega por HTTP con una firma de Stripe válida.
 *
 * Uso:
 *   node --env-file=.env.local scripts/fase1-aceptacion.mjs [http://localhost:3000]
 *
 * Requiere DATABASE_URL, STRIPE_RUN_WEBHOOK_SECRET_TEST y CRON_SECRET.
 * Crea su propio evento de prueba y lo borra al terminar.
 */

import postgres from "postgres";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const SECRETO_WEBHOOK = process.env.STRIPE_RUN_WEBHOOK_SECRET_TEST;
const CRON_SECRET = process.env.CRON_SECRET;

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!SECRETO_WEBHOOK) throw new Error("Falta STRIPE_RUN_WEBHOOK_SECRET_TEST");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST ?? "sk_test_x", {
  apiVersion: "2025-02-24.acacia",
});

const CUPO = 5;
const PRECIO = 45000; // $450.00 MXN

let fallas = 0;
function verificar(descripcion, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallas += 1;
  console.log(`${ok ? "✓" : "✗"} ${descripcion}${ok ? "" : `\n    esperado ${JSON.stringify(esperado)}, obtenido ${JSON.stringify(real)}`}`);
}

async function cupoDisponible(tipoBoletoId) {
  const [f] = await sql`
    select tb.cupo_total - (
             select count(*)
               from public.boleto b
               join public.orden  o on o.id = b.orden_id
              where b.tipo_boleto_id = tb.id
                and (o.estado = 'pagada'
                     or (o.estado = 'pendiente' and o.expira_en > now()))
           )::int as disponibles
      from public.tipo_boleto tb
     where tb.id = ${tipoBoletoId}
  `;
  return f.disponibles;
}

/** Crea una orden pendiente con un boleto, igual que /api/run/orden. */
async function crearOrden(eventoId, tipoBoletoId, expiraEn) {
  return sql.begin(async (tx) => {
    const [orden] = await tx`
      insert into public.orden (evento_id, correo_comprador, nombre_comprador,
                                monto_inscripcion, monto_donativo, estado, expira_en)
      values (${eventoId}, 'prueba@example.com', 'Prueba Aceptación',
              ${PRECIO}, 0, 'pendiente', ${expiraEn})
      returning id, folio
    `;
    await tx`
      insert into public.boleto (evento_id, orden_id, tipo_boleto_id, estado, token_activacion)
      values (${eventoId}, ${orden.id}, ${tipoBoletoId}, 'pendiente', ${randomUUID()})
    `;
    return orden;
  });
}

async function dispararWebhook(evento) {
  const cuerpo = JSON.stringify(evento);
  const firma = stripe.webhooks.generateTestHeaderString({ payload: cuerpo, secret: SECRETO_WEBHOOK });
  const res = await fetch(`${BASE}/api/run/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": firma },
    body: cuerpo,
  });
  return { status: res.status, cuerpo: await res.json().catch(() => ({})) };
}

async function main() {
  console.log(`Servidor: ${BASE}`);
  console.log("");

  // ── Preparación: evento propio, para no tocar datos reales ──────────
  const slug = `aceptacion-${Date.now()}`;
  const [evento] = await sql`
    insert into public.evento (nombre, slug, fecha_carrera, sede, estado, ttl_reserva_horas)
    values ('Prueba de aceptación', ${slug}, now() + interval '90 days',
            'Sede de prueba', 'venta_abierta', 24)
    returning id
  `;
  const [tipo] = await sql`
    insert into public.tipo_boleto (evento_id, nombre, precio_centavos, cupo_total)
    values (${evento.id}, 'Boleto de prueba', ${PRECIO}, ${CUPO})
    returning id
  `;

  try {
    // ── 1. Idempotencia del webhook ──────────────────────────────────
    console.log("1. Webhook idempotente");
    const orden = await crearOrden(evento.id, tipo.id, new Date(Date.now() + 3600_000));

    verificar("cupo tras reservar (pendiente vigente ocupa lugar)", await cupoDisponible(tipo.id), CUPO - 1);

    const eventoStripe = {
      id: `evt_prueba_${randomUUID().slice(0, 8)}`,
      object: "event",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_${randomUUID().slice(0, 8)}`,
          object: "checkout.session",
          payment_status: "paid",
          amount_total: PRECIO,
          payment_method_types: ["card"],
          payment_intent: null,
          metadata: {
            modulo: "run",
            evento_id: evento.id,
            orden_id: orden.id,
            folio: orden.folio,
          },
        },
      },
    };

    const respuestas = [];
    for (let i = 0; i < 3; i += 1) respuestas.push(await dispararWebhook(eventoStripe));

    verificar("las tres entregas responden 200", respuestas.map((r) => r.status), [200, 200, 200]);
    verificar(
      "la segunda y la tercera se reconocen como reenvío",
      respuestas.map((r) => Boolean(r.cuerpo.duplicado)),
      [false, true, true],
    );

    const [{ estado }] = await sql`select estado from public.orden where id = ${orden.id}`;
    verificar("la orden queda pagada", estado, "pagada");

    const [{ pagos }] = await sql`
      select count(*)::int as pagos from public.pago where orden_id = ${orden.id}
    `;
    verificar("se registró un solo pago", pagos, 1);

    const [{ conPayload }] = await sql`
      select count(*)::int as "conPayload" from public.pago
       where orden_id = ${orden.id} and payload_crudo is not null
    `;
    verificar("el pago guardó el payload crudo", conPayload, 1);

    const [{ boletosPagados }] = await sql`
      select count(*)::int as "boletosPagados" from public.boleto
       where orden_id = ${orden.id} and estado = 'pagado'
    `;
    verificar("el boleto pasó a pagado", boletosPagados, 1);

    verificar("el cupo bajó exactamente en uno", await cupoDisponible(tipo.id), CUPO - 1);

    // ── 2. Expiración por TTL ────────────────────────────────────────
    console.log("");
    console.log("2. Expiración de reservas");
    const vencida = await crearOrden(evento.id, tipo.id, new Date(Date.now() - 3600_000));

    verificar(
      "una orden vencida ya no ocupa cupo",
      await cupoDisponible(tipo.id),
      CUPO - 1,
    );

    const viva = await crearOrden(evento.id, tipo.id, new Date(Date.now() + 3600_000));
    verificar("una pendiente vigente sí lo ocupa", await cupoDisponible(tipo.id), CUPO - 2);

    if (CRON_SECRET) {
      const res = await fetch(`${BASE}/api/run/cron/expirar`, {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      });
      const datos = await res.json().catch(() => ({}));
      verificar("el cron responde 200", res.status, 200);

      const [{ estado: estadoVencida }] = await sql`
        select estado from public.orden where id = ${vencida.id}
      `;
      verificar("el cron marcó la vencida como expirada", estadoVencida, "expirada");

      const [{ estado: estadoViva }] = await sql`
        select estado from public.orden where id = ${viva.id}
      `;
      verificar("el cron no tocó la vigente", estadoViva, "pendiente");
      console.log(`    (expiradas: ${datos.expiradas}, avisadas: ${datos.avisadas})`);

      const sinAutorizar = await fetch(`${BASE}/api/run/cron/expirar`);
      verificar("sin credencial, el cron responde 401", sinAutorizar.status, 401);
    } else {
      console.log("· CRON_SECRET no configurado, se omite la parte del cron");
    }

    // ── 3. Cupo agotado ──────────────────────────────────────────────
    console.log("");
    console.log("3. Tope de cupo");
    const restante = await cupoDisponible(tipo.id);
    for (let i = 0; i < restante; i += 1) {
      await crearOrden(evento.id, tipo.id, new Date(Date.now() + 3600_000));
    }
    verificar("al llenarse, el cupo llega a cero", await cupoDisponible(tipo.id), 0);
  } finally {
    // orden → cascada a boleto y pago; después tipo_boleto y el evento.
    await sql`delete from public.orden where evento_id = ${evento.id}`;
    await sql`delete from public.tipo_boleto where evento_id = ${evento.id}`;
    await sql`delete from public.evento where id = ${evento.id}`;
  }

  console.log("");
  console.log(fallas === 0 ? "Todo pasó." : `${fallas} verificaciones fallaron.`);
  return fallas;
}

main()
  .then(async (f) => {
    await sql.end();
    process.exit(f === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
