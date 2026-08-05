import { NextResponse } from "next/server";
import { db, enTransaccion } from "@/lib/db";
import { aplicarTransicionOrden } from "@/lib/run/estados";
import { enviarRecordatorioVencimiento } from "@/lib/run/correos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron de expiración de reservas.
 *
 * Hace dos cosas, en este orden:
 *   1. Expira las órdenes `pendiente` cuyo TTL ya pasó — es lo que devuelve
 *      el cupo al inventario.
 *   2. Avisa a las que vencen en menos de 24 h, una sola vez.
 *
 * El cupo disponible ya descuenta solas las órdenes vencidas (la consulta
 * filtra por `expira_en > now()`), así que este cron no arregla el conteo:
 * lo que hace es dejar el estado explícito para los reportes y disparar el
 * recordatorio. Sin él, la base se llena de órdenes zombi en `pendiente`.
 *
 * Corre una vez al día (vercel.json), que es lo que permite el plan Hobby y
 * además calza con la ventana del aviso: se avisa a lo que vence en menos de
 * 24 h, así que un pase diario las alcanza todas. En Pro se puede subir a
 * cada hora cambiando la expresión a "17 * * * *".
 */

const VENTANA_AVISO_HORAS = 24;

function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  // Sin secreto configurado no se corre: un endpoint que cancela órdenes no
  // puede quedar abierto por omisión.
  if (!secreto) return false;
  return request.headers.get("authorization") === `Bearer ${secreto}`;
}

async function ejecutar() {
  const sql = db();

  // ── 1. Expirar vencidas ────────────────────────────────────────────
  const vencidas = await sql<{ id: string }[]>`
    select id
      from public.orden
     where estado = 'pendiente'
       and expira_en is not null
       and expira_en < now()
     limit 500
  `;

  let expiradas = 0;
  for (const orden of vencidas) {
    const r = await enTransaccion((tx) => aplicarTransicionOrden(tx, orden.id, "expirada"));
    if (r.cambio) expiradas += 1;
  }

  // ── 2. Recordar las que vencen pronto ──────────────────────────────
  const porVencer = await sql<
    {
      id: string;
      folio: string;
      correo_comprador: string;
      expira_en: Date;
      total: number;
      referencia: string | null;
    }[]
  >`
    select o.id,
           o.folio,
           o.correo_comprador,
           o.expira_en,
           (o.monto_inscripcion + o.monto_donativo + o.monto_addons)::int as total,
           (select p.referencia_externa
              from public.pago p
             where p.orden_id = o.id
               and p.referencia_externa is not null
             order by p.creado_en desc
             limit 1) as referencia
      from public.orden o
     where o.estado = 'pendiente'
       and o.recordatorio_en is null
       and o.expira_en is not null
       and o.expira_en > now()
       and o.expira_en < now() + ${`${VENTANA_AVISO_HORAS} hours`}::interval
     limit 200
  `;

  let avisadas = 0;
  for (const orden of porVencer) {
    const r = await enviarRecordatorioVencimiento({
      correo: orden.correo_comprador,
      folio: orden.folio,
      totalCentavos: orden.total,
      venceEn: orden.expira_en,
      referencia: orden.referencia,
    });
    // Se marca solo si salió: si Resend falla, el próximo pase reintenta.
    if (r.ok) {
      await sql`update public.orden set recordatorio_en = now() where id = ${orden.id}`;
      avisadas += 1;
    }
  }

  return { expiradas, avisadas, revisadas: vencidas.length + porVencer.length };
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await ejecutar()) });
  } catch (err) {
    console.error("[run/cron/expirar]", err);
    return NextResponse.json({ error: "Error al expirar órdenes" }, { status: 500 });
  }
}

export const POST = GET;
