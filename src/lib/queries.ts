import "server-only";
import { cache } from "react";
import { conReintento, db, hayBaseDeDatos } from "@/lib/db";
import {
  donanteRecienteDeStripe,
  donantesDeStripe,
  totalesDeStripe,
} from "@/lib/donativos-stripe";

/**
 * Lecturas públicas de donativos.
 *
 * La fuente de verdad es Postgres, no la API de Stripe. Stripe es el riel de
 * cobro: el webhook escribe aquí y todo lo demás lee de aquí. Mientras se
 * leía en vivo de Stripe había dos fuentes de verdad, y el primer reembolso
 * hecho desde el dashboard las habría separado sin que nadie se enterara.
 *
 * Las tablas y los agregados (`totals`, `donors.total_donated_cents`) vienen
 * de 0001_init.sql y los mantienen triggers, así que aquí solo hay lecturas.
 *
 * Mientras DATABASE_URL no exista, estas funciones caen al lector de Stripe
 * (donativos-stripe.ts) en lugar de devolver ceros. Sin ese respaldo, el
 * primer despliegue sin base configurada dejaría el sitio anunciando cero
 * recaudado y cero donantes — que es peor que la duplicidad que se quiso
 * quitar. En cuanto la base esté, el respaldo deja de usarse solo.
 */

export type PublicDonor = {
  display_name: string | null;
  total_donated_cents: number;
  updated_at: string;
};

export type Totals = {
  raised_cents: number;
  donor_count: number;
  donation_count: number;
};

export type RecentDonor = {
  display_name: string;
  total_donated_cents: number;
  updated_at: string;
};

const FALLBACK_TOTALS: Totals = { raised_cents: 0, donor_count: 0, donation_count: 0 };

export const getTotals = cache(async (): Promise<Totals> => {
  if (!hayBaseDeDatos()) return totalesDeStripe();
  try {
    const filas = await conReintento(() => db()<Totals[]>`
      select raised_cents::int as raised_cents,
             donor_count,
             donation_count
        from public.totals
       where id = 1
    `);
    return filas[0] ?? FALLBACK_TOTALS;
  } catch (err) {
    console.error("[getTotals] consulta a Postgres falló:", err);
    return FALLBACK_TOTALS;
  }
});

export const getPublicDonors = cache(async (limit = 5): Promise<PublicDonor[]> => {
  if (!hayBaseDeDatos()) return donantesDeStripe(limit);
  try {
    const filas = await conReintento(() => db()<
      { display_name: string | null; total_donated_cents: number; updated_at: Date }[]
    >`
      select display_name,
             total_donated_cents::int as total_donated_cents,
             updated_at
        from public.donors
       where list_public = true
         and total_donated_cents > 0
       order by total_donated_cents desc
       limit ${limit}
    `);
    return filas.map((f) => ({ ...f, updated_at: f.updated_at.toISOString() }));
  } catch (err) {
    console.error("[getPublicDonors] consulta a Postgres falló:", err);
    return [];
  }
});

export const getMostRecentDonor = cache(async (): Promise<RecentDonor | null> => {
  if (!hayBaseDeDatos()) return donanteRecienteDeStripe();
  try {
    const filas = await conReintento(() => db()<
      { display_name: string; total_donated_cents: number; updated_at: Date }[]
    >`
      select d.display_name,
             d.total_donated_cents::int as total_donated_cents,
             dn.created_at              as updated_at
        from public.donations dn
        join public.donors    d on d.id = dn.donor_id
       where d.list_public = true
         and d.display_name is not null
         and dn.status = 'succeeded'
       order by dn.created_at desc
       limit 1
    `);
    const f = filas[0];
    return f ? { ...f, updated_at: f.updated_at.toISOString() } : null;
  } catch (err) {
    console.error("[getMostRecentDonor] consulta a Postgres falló:", err);
    return null;
  }
});
