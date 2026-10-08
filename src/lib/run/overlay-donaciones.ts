// Lógica de servidor para los overlays de donaciones en vivo.
// Consulta a Supabase vía la función SQL `overlay_donaciones` (ver sql/overlay_donaciones.sql).

import { createClient } from "@supabase/supabase-js";

export type DonacionOverlay = {
  id: string;
  /** null = donador anónimo */
  nombre: string | null;
  centavos: number;
  /** ISO 8601 */
  creadoEn: string;
};

export type RespuestaOverlay = {
  /** Hora del servidor (ISO). El cliente la usa para calcular "hace X min" sin depender de su reloj. */
  ahora: string;
  totalCentavos: number;
  cantidad: number;
  /** Más reciente primero */
  recientes: DonacionOverlay[];
};

export type Alcance = "hoy" | "todo";

/** Inicio del día actual en hora de México (UTC-6 fijo, sin horario de verano desde 2022). */
export function inicioDelDiaMx(ahora = new Date()): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora); // "2026-10-09"
  return new Date(`${partes}T00:00:00-06:00`);
}

type Consulta = { desde: Date | null; limite: number };
type Resultado = { totalCentavos: number; cantidad: number; filas: DonacionOverlay[] };

// Cliente con service role: SOLO se usa en el servidor (esta ruta nunca llega al navegador).
const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type FilaSql = { id: string; name: string | null; centavos: number | string; created_at: string };
type RespuestaSql = { total: number | string; cantidad: number | string; filas: FilaSql[] };

async function consultar({ desde, limite }: Consulta): Promise<Resultado> {
  const { data, error } = await supabase.rpc("overlay_donaciones", {
    p_desde: desde ? desde.toISOString() : null,
    p_limite: limite,
  });
  if (error) throw new Error(`overlay_donaciones: ${error.message}`);

  const r = data as RespuestaSql;
  return {
    totalCentavos: Number(r.total),
    cantidad: Number(r.cantidad),
    filas: r.filas.map((f) => ({
      id: String(f.id),
      nombre: f.name?.trim() || null,
      centavos: Number(f.centavos),
      creadoEn: new Date(f.created_at).toISOString(),
    })),
  };
}

export async function resumenDonaciones(alcance: Alcance, limite: number): Promise<RespuestaOverlay> {
  const ahora = new Date();
  const desde = alcance === "hoy" ? inicioDelDiaMx(ahora) : null;
  const r = await consultar({ desde, limite });
  return {
    ahora: ahora.toISOString(),
    totalCentavos: r.totalCentavos,
    cantidad: r.cantidad,
    recientes: r.filas,
  };
}