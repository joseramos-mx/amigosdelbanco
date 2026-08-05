/**
 * Abre la venta del Social Run con precio y cupo reales.
 *
 * El evento nace en `borrador` con precio 0 a propósito: así nadie puede
 * comprar con cifras inventadas. Este script es el único lugar donde se
 * cambian, y valida antes de tocar nada.
 *
 *   node --env-file=.env.local scripts/run-abrir-venta.mjs \
 *     --precio=450 --cupo=500 [--dorsales=1000-1999] [--fecha=2026-10-16T17:00:00-06:00] [--dry-run]
 *
 * El precio va en PESOS, no en centavos.
 *
 * Para cerrar la venta otra vez:
 *   node --env-file=.env.local scripts/run-abrir-venta.mjs --cerrar
 */

import postgres from "postgres";

const SLUG = "social-run-2026";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");

const args = new Map(
  process.argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
);

const DRY = args.has("dry-run");
const CERRAR = args.has("cerrar");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

function pesosACentavos(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Precio inválido: ${valor}`);
  return Math.round(n * 100);
}

function rangoDorsales(valor) {
  if (!valor) return null;
  const m = String(valor).match(/^(\d+)-(\d+)$/);
  if (!m) throw new Error(`Rango de dorsales inválido: ${valor} (formato 1000-1999)`);
  const desde = Number(m[1]);
  const hasta = Number(m[2]);
  if (hasta < desde) throw new Error("El rango de dorsales va de menor a mayor");
  return { desde, hasta };
}

async function main() {
  const [evento] = await sql`
    select e.id, e.nombre, e.estado, e.fecha_carrera,
           tb.id as tipo_id, tb.nombre as tipo_nombre,
           tb.precio_centavos::int as precio, tb.cupo_total,
           tb.dorsal_desde, tb.dorsal_hasta
      from public.evento e
      join public.tipo_boleto tb on tb.evento_id = e.id
     where e.slug = ${SLUG}
  `;

  if (!evento) throw new Error(`No existe el evento ${SLUG}. ¿Corriste npm run db:migrate?`);

  console.log(`Evento: ${evento.nombre}`);
  console.log(`Estado actual: ${evento.estado}`);
  console.log(
    `Boleto: ${evento.tipo_nombre} — $${(evento.precio / 100).toFixed(2)} · ` +
      `${evento.cupo_total} lugares · dorsales ${evento.dorsal_desde ?? "sin definir"}`,
  );
  console.log("");

  if (CERRAR) {
    if (DRY) return console.log("(--dry-run) cerraría la venta");
    await sql`update public.evento set estado = 'venta_cerrada' where id = ${evento.id}`;
    console.log("Venta cerrada. Las órdenes pendientes siguen su curso normal.");
    return;
  }

  const precio = args.has("precio") ? pesosACentavos(args.get("precio")) : null;
  const cupo = args.has("cupo") ? Number(args.get("cupo")) : null;
  const dorsales = rangoDorsales(args.get("dorsales"));
  const fecha = args.get("fecha");

  if (!precio || !cupo) {
    console.error("Faltan --precio y --cupo. Nada que hacer.");
    console.error("Ejemplo: --precio=450 --cupo=500 --dorsales=1000-1499");
    process.exitCode = 1;
    return;
  }
  if (!Number.isInteger(cupo) || cupo <= 0) throw new Error(`Cupo inválido: ${cupo}`);
  if (dorsales && dorsales.hasta - dorsales.desde + 1 < cupo) {
    throw new Error(
      `El rango de dorsales (${dorsales.hasta - dorsales.desde + 1}) no alcanza para ${cupo} lugares`,
    );
  }

  const vendidos = await sql`
    select count(*)::int as n
      from public.boleto b
      join public.orden o on o.id = b.orden_id
     where b.tipo_boleto_id = ${evento.tipo_id}
       and (o.estado = 'pagada' or (o.estado = 'pendiente' and o.expira_en > now()))
  `;
  if (vendidos[0].n > cupo) {
    throw new Error(`Ya hay ${vendidos[0].n} lugares tomados: el cupo no puede bajar a ${cupo}`);
  }

  console.log("Quedará así:");
  console.log(`  precio      $${(precio / 100).toFixed(2)} MXN`);
  console.log(`  cupo        ${cupo} lugares (${vendidos[0].n} ya tomados)`);
  if (dorsales) console.log(`  dorsales    ${dorsales.desde}-${dorsales.hasta}`);
  if (fecha) console.log(`  fecha       ${fecha}`);
  console.log(`  estado      venta_abierta`);

  if (DRY) return console.log("\n(--dry-run) no se aplicó nada");

  await sql.begin(async (tx) => {
    await tx`
      update public.tipo_boleto
         set precio_centavos = ${precio},
             cupo_total      = ${cupo},
             dorsal_desde    = ${dorsales?.desde ?? null},
             dorsal_hasta    = ${dorsales?.hasta ?? null}
       where id = ${evento.tipo_id}
    `;

    // El contador de dorsales arranca en el inicio del rango; sin rango se
    // queda en cero y la asignación (Fase 3) falla en voz alta.
    await tx`
      update public.dorsal_secuencia
         set siguiente = ${dorsales?.desde ?? 0}
       where tipo_boleto_id = ${evento.tipo_id}
    `;

    if (fecha) {
      await tx`update public.evento set fecha_carrera = ${fecha}::timestamptz where id = ${evento.id}`;
    }

    await tx`update public.evento set estado = 'venta_abierta' where id = ${evento.id}`;
  });

  console.log("");
  console.log("Venta abierta. /run/inscripcion ya vende.");
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err.message);
    await sql.end();
    process.exit(1);
  });
