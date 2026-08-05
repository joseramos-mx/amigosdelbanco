/**
 * Aplica las migraciones de supabase/migrations/ contra DATABASE_URL.
 *
 * No hay CLI de Supabase vinculado al proyecto, y son cuatro archivos que
 * deben ir en orden. Esto lleva el registro en `schema_migrations`, así que
 * es idempotente: correrlo dos veces no vuelve a aplicar nada.
 *
 * Cada archivo va dentro de su propia transacción — si algo truena a la
 * mitad, esa migración no queda a medias.
 *
 *   node --env-file=.env.local scripts/db-migrate.mjs [--dry-run]
 *
 * Pensado para el pooler de Supabase. Contra el Postgres local de
 * `npm run db:local` no hace falta —ese script ya aplica las migraciones
 * al arrancar— y de hecho no corre: 0001 pide la extensión pgcrypto, que
 * PGlite no trae. En Supabase existe, así que se deja tal cual está.
 */

import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const DRY = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  onnotice: () => {},
});

function destino(url) {
  // Se imprime el host para saber contra qué base se está corriendo, sin
  // enseñar usuario ni contraseña.
  try {
    return new URL(url).host;
  } catch {
    return "destino desconocido";
  }
}

async function main() {
  console.log(`Base: ${destino(process.env.DATABASE_URL)}`);

  await sql`
    create table if not exists public.schema_migrations (
      nombre      text primary key,
      aplicada_en timestamptz not null default now()
    )
  `;

  const aplicadas = new Set(
    (await sql`select nombre from public.schema_migrations`).map((f) => f.nombre),
  );

  const archivos = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pendientes = archivos.filter((f) => !aplicadas.has(f));

  if (!pendientes.length) {
    console.log(`Sin pendientes — ${archivos.length} migraciones ya aplicadas.`);
    return;
  }

  console.log(`Pendientes: ${pendientes.join(", ")}`);
  if (DRY) {
    console.log("(--dry-run: no se aplicó nada)");
    return;
  }

  for (const archivo of pendientes) {
    const contenido = readFileSync(join(DIR, archivo), "utf8");
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(contenido);
        await tx`insert into public.schema_migrations (nombre) values (${archivo})`;
      });
      console.log(`✓ ${archivo}`);
    } catch (err) {
      console.error(`✗ ${archivo}`);
      console.error(`  ${err.message}`);
      throw err;
    }
  }

  console.log("");
  console.log(`Listo: ${pendientes.length} migraciones aplicadas.`);
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    if (!/^✗/.test(String(err.message))) console.error(err.message);
    await sql.end();
    process.exit(1);
  });
