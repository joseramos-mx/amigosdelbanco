/**
 * Base de datos local para desarrollo, sin Docker ni Postgres instalado.
 *
 * Levanta PGlite (Postgres 17 compilado a WASM) hablando el protocolo nativo
 * en un socket TCP, aplica todas las migraciones de supabase/migrations y
 * deja la venta abierta con valores de prueba. postgres.js se conecta igual
 * que a Supabase: la app no nota la diferencia.
 *
 *   npm run db:local          # deja la terminal ocupada, es un servidor
 *   npm run dev               # en otra terminal
 *
 * Y en .env.local:
 *   DATABASE_URL=postgres://postgres@127.0.0.1:5433/postgres
 *   RUN_DB_MAX_CONEXIONES=1
 *
 * Ojo: el puente de PGlite atiende un cliente a la vez, por eso el pool va
 * en 1. Los datos viven en memoria y se pierden al cerrar; para algo
 * persistente o multiconexión, usa un Postgres de verdad (Supabase).
 */

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PUERTO = Number(process.env.PGLITE_PORT ?? 5433);
const DIR = "supabase/migrations";

// Valores de prueba para poder comprar en local. Los de verdad se cargan
// con un UPDATE cuando estén confirmados; ver 0003_seed_run_evento.sql.
const PRECIO_PRUEBA = 45000; // $450.00 MXN
const CUPO_PRUEBA = 200;

const db = await PGlite.create();

for (const archivo of readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort()) {
  const sql = readFileSync(join(DIR, archivo), "utf8")
    // PGlite no trae contrib/pgcrypto, pero gen_random_uuid() es nativo
    // desde Postgres 13, así que la extensión no hace falta.
    .replace(/create extension if not exists "pgcrypto";/g, "");
  try {
    await db.exec(sql);
    console.log(`✓ ${archivo}`);
  } catch (err) {
    console.error(`✗ ${archivo}\n  ${err.message}`);
    process.exit(1);
  }
}

await db.exec(`
  update public.tipo_boleto
     set precio_centavos = ${PRECIO_PRUEBA},
         cupo_total      = ${CUPO_PRUEBA}
   where evento_id = (select id from public.evento where slug = 'social-run-2026');

  update public.evento
     set estado = 'venta_abierta'
   where slug = 'social-run-2026';
`);

const server = new PGLiteSocketServer({ db, port: PUERTO, host: "127.0.0.1" });
await server.start();

console.log("");
console.log(`Postgres local en postgres://postgres@127.0.0.1:${PUERTO}/postgres`);
console.log(`Venta abierta con datos de prueba: $${PRECIO_PRUEBA / 100} MXN · ${CUPO_PRUEBA} lugares`);
console.log("Ctrl+C para detener. Los datos se pierden al cerrar.");

const cerrar = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
