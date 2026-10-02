/**
 * Limpia todas las pruebas (órdenes, boletos, checkins y pagos) del evento principal.
 * 
 * USO:
 *   node --env-file=.env.local scripts/run-limpiar-pruebas.mjs
 * 
 * ¡CUIDADO! Esto borra todas las ventas registradas. Úsalo solo en desarrollo
 * o antes de lanzar el evento al público.
 */

import postgres from "postgres";

const SLUG = "social-run-2026";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

async function main() {
  const [evento] = await sql`
    select e.id, tb.id as tipo_id, tb.dorsal_desde
      from public.evento e
      join public.tipo_boleto tb on tb.evento_id = e.id
     where e.slug = ${SLUG}
  `;

  if (!evento) throw new Error(`No existe el evento ${SLUG}`);

  console.log(`Limpiando datos de prueba para el evento: ${SLUG}...`);

  await sql.begin(async (tx) => {
    // 1. Borrar checkins (entregas de kits)
    await tx`
      delete from public.checkin 
       where boleto_id in (select id from public.boleto where evento_id = ${evento.id})
    `;
    console.log("- Checkins borrados");

    // 2. Borrar boletos
    await tx`delete from public.boleto where evento_id = ${evento.id}`;
    console.log("- Boletos borrados");

    // 3. Borrar pagos
    await tx`
      delete from public.pago 
       where orden_id in (select id from public.orden where evento_id = ${evento.id})
    `;
    console.log("- Pagos borrados");

    // 4. Borrar órdenes
    await tx`delete from public.orden where evento_id = ${evento.id}`;
    console.log("- Órdenes de compra borradas");

    // 5. Reiniciar el contador de dorsales
    await tx`
      update public.dorsal_secuencia 
         set siguiente = ${evento.dorsal_desde ?? 0}
       where tipo_boleto_id = ${evento.tipo_id}
    `;
    console.log("- Secuencia de dorsales reiniciada");

    // 6. Reiniciar folios a 1 (GG-00001)
    await tx`alter sequence public.orden_folio_seq restart with 1`;
    console.log("- Contador de folios (GG-XXXXX) reiniciado");
  });

  console.log("\n¡Listo! El panel de admin y la base de datos están en ceros otra vez.");
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error("Error:", err.message);
    await sql.end();
    process.exit(1);
  });
