/**
 * Genera boletos físicos pre-pagados (Venta Física).
 *
 * Cada boleto físico se crea como una orden independiente (para que tenga su propio Folio).
 * Nacen pagados, descuentan cupo del inventario general, y generan una liga de activación
 * para que el corredor pueda llenar sus datos en casa.
 *
 * USO:
 *   node --env-file=.env.local scripts/run-fisicos.mjs --cantidad=50
 */

import postgres from "postgres";
import { createHmac, randomUUID } from "node:crypto";

const SLUG = "social-run-2026";
const SECRETO = process.env.RUN_TOKEN_SECRET;

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!SECRETO) throw new Error("Falta RUN_TOKEN_SECRET en .env.local");

const args = new Map(
  process.argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
);

const cantidad = Number(args.get("cantidad")) || 1;
if (cantidad < 1 || cantidad > 1000) throw new Error("Cantidad inválida (1-1000)");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => { } });

const b64 = (s) => Buffer.from(s).toString("base64url");
const firmar = (payload, dominio) =>
  b64(createHmac("sha256", `${SECRETO}:${dominio}`).update(payload).digest());

function tokenActivacion(boletoId, expiraEn) {
  const payload = b64(JSON.stringify({ b: boletoId, e: Math.floor(expiraEn.getTime() / 1000) }));
  return `${payload}.${firmar(payload, "activacion")}`;
}

async function main() {
  const [evento] = await sql`
    select e.id, e.fecha_carrera, tb.id as tipo_id, tb.precio_centavos
      from public.evento e
      join public.tipo_boleto tb on tb.evento_id = e.id
     where e.slug = ${SLUG}
  `;

  if (!evento) throw new Error(`No existe el evento ${SLUG}`);

  console.log(`Generando ${cantidad} boletos físicos...`);

  const expiraToken = new Date(evento.fecha_carrera.getTime() + 86_400_000); // 1 día después de la carrera

  const generados = await sql.begin(async (tx) => {
    // 1. Bloquear y revisar cupo disponible
    await tx`select id from public.tipo_boleto where id = ${evento.tipo_id} for update`;

    const [{ disponibles }] = await tx`
      select tb.cupo_total - (
               select count(*)
                 from public.boleto b
                 join public.orden  o on o.id = b.orden_id
                where b.tipo_boleto_id = tb.id
                  and (o.estado = 'pagada'
                       or (o.estado = 'pendiente' and o.expira_en > now()))
             )::int as disponibles
        from public.tipo_boleto tb
       where tb.id = ${evento.tipo_id}
    `;

    if (cantidad > disponibles) {
      throw new Error(`Cupo insuficiente. Intentas generar ${cantidad} pero solo quedan ${disponibles}.`);
    }

    const resultados = [];

    // 2. Generar órdenes independientes (1 por boleto físico)
    for (let i = 0; i < cantidad; i++) {
      const [orden] = await tx`
        insert into public.orden (
          evento_id, correo_comprador, nombre_comprador,
          monto_inscripcion, monto_donativo, estado, expira_en
        ) values (
          ${evento.id}, 'venta.fisica@bancodurango.org', 'Venta Física',
          ${evento.precio_centavos}, 0, 'pendiente', null
        )
        returning id, folio
      `;

      const boletoId = randomUUID();
      const token = tokenActivacion(boletoId, expiraToken);

      await tx`
        insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado, token_activacion, boleto_fisico)
        values (${boletoId}, ${evento.id}, ${orden.id}, ${evento.tipo_id}, 'pendiente', ${token}, true)
      `;

      resultados.push({ folio: orden.folio, token });
    }

    return resultados;
  });

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  console.log("\n=============================================");
  console.log("🎟️ BOLETOS FÍSICOS GENERADOS CON ÉXITO");
  console.log("=============================================\n");

  for (const b of generados) {
    console.log(`Folio: ${b.folio}`);
    console.log(`Liga:  ${baseUrl}/run/activar/${b.token}`);
    console.log("---------------------------------------------");
  }
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error("Error:", err.message);
    await sql.end();
    process.exit(1);
  });
