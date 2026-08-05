import "server-only";
import postgres from "postgres";

/**
 * Conexión a Postgres para el módulo de inscripciones.
 *
 * Driver directo y no supabase-js a propósito: PostgREST habla HTTP sin
 * estado, así que no hay forma de mantener una transacción entre llamadas.
 * Sin transacciones no existen ni el `SELECT ... FOR UPDATE` del dorsal ni
 * la transición atómica del webhook, que son dos de las tres reglas que
 * sostienen el sistema.
 *
 * DATABASE_URL debe apuntar al **pooler en modo transacción** de Supabase
 * (puerto 6543), nunca al puerto directo: cada instancia de función en
 * Vercel abre su propio pool y el directo se queda sin conexiones.
 */

/**
 * Conexiones por instancia. Tres es el techo sano en Vercel: cada instancia
 * de función abre su propio pool y el pooler de Supabase se comparte entre
 * todas. `RUN_DB_MAX_CONEXIONES` permite bajarlo (por ejemplo a 1 contra un
 * Postgres local de una sola conexión) sin tocar código.
 */
function maxConexiones(): number {
  const crudo = Number(process.env.RUN_DB_MAX_CONEXIONES);
  if (!Number.isFinite(crudo)) return 3;
  return Math.min(10, Math.max(1, Math.trunc(crudo)));
}

let cached: postgres.Sql | null = null;

function crearCliente(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Agrégala en Vercel → Project Settings → " +
        "Environment Variables (usa el pooler en modo transacción, puerto 6543), " +
        "o en .env.local para desarrollo.",
    );
  }

  return postgres(url, {
    max: maxConexiones(),
    idle_timeout: 20,
    connect_timeout: 10,
    // El pooler en modo transacción no soporta sentencias preparadas.
    prepare: false,
    // postgres.js devuelve int8 como string para no perder precisión. Las
    // consultas de este módulo castean los montos a ::int, que es lo que
    // espera el código; no cambies eso por un parser global de bigint.
    onnotice: () => {},
  });
}

/**
 * Cliente perezoso: un throw a nivel de módulo tumbaría el build de Next,
 * que importa los route handlers al recolectar datos de página. Igual que
 * en src/lib/stripe.ts, se difiere hasta la primera consulta real.
 */
export function db(): postgres.Sql {
  if (!cached) cached = crearCliente();
  return cached;
}

export function hayBaseDeDatos(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Ejecuta `fn` dentro de una transacción. Si lanza, hace rollback.
 *
 *   await enTransaccion(async (tx) => {
 *     await tx`update orden set estado = 'pagada' where id = ${id}`;
 *   });
 *
 * El callback recibe el cliente transaccional: cualquier consulta que se
 * haga con `db()` en lugar de con `tx` sale de la transacción y rompe la
 * atomicidad sin avisar.
 */
export async function enTransaccion<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return db().begin(fn) as Promise<T>;
}

/** Código de error de Postgres para violación de restricción única. */
export const UNIQUE_VIOLATION = "23505";

export function esViolacionUnica(err: unknown, restriccion?: string): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; constraint_name?: string };
  if (e.code !== UNIQUE_VIOLATION) return false;
  return restriccion ? e.constraint_name === restriccion : true;
}
