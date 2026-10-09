// Donaciones en efectivo: lógica de servidor (tabla public.cash_donations).
import { createClient } from "@supabase/supabase-js";
import { inicioDelDiaMx } from "@/lib/run/overlay-donaciones";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export type Efectivo = {
  id: string;
  centavos: number;
  /** Nombre de quien donó (null = anónimo) */
  nombre: string | null;
  creadoPor: string | null;
  creadoEn: string;
};

export type ResumenEfectivo = {
  ahora: string;
  totalCentavos: number;
  hoyCentavos: number;
  cantidad: number;
  /** Más reciente primero (solo no anuladas) */
  recientes: Efectivo[];
};

const MAX_CENTAVOS = 10_000_000_000; // $100,000,000 por captura

export async function resumenEfectivo(): Promise<ResumenEfectivo> {
  const { data, error } = await supabase
    .from("cash_donations")
    .select("id, amount_cents, donor_name, created_by, created_at")
    .is("voided_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`cash_donations: ${error.message}`);

  const hoy = inicioDelDiaMx().getTime();
  let total = 0;
  let deHoy = 0;
  for (const r of data) {
    const c = Number(r.amount_cents);
    total += c;
    if (Date.parse(r.created_at) >= hoy) deHoy += c;
  }

  return {
    ahora: new Date().toISOString(),
    totalCentavos: total,
    hoyCentavos: deHoy,
    cantidad: data.length,
    recientes: data.slice(0, 8).map((r) => ({
      id: String(r.id),
      centavos: Number(r.amount_cents),
      nombre: r.donor_name,
      creadoPor: r.created_by,
      creadoEn: new Date(r.created_at).toISOString(),
    })),
  };
}

export async function agregarEfectivo(centavos: number, nombre: string | null, creadoPor: string | null) {
  if (!Number.isInteger(centavos) || centavos <= 0 || centavos > MAX_CENTAVOS) {
    throw new Error("Monto inválido");
  }
  const { error } = await supabase.from("cash_donations").insert({
    amount_cents: centavos,
    donor_name: nombre?.trim().replace(/\s+/g, " ").slice(0, 60) || null,
    created_by: creadoPor,
  });
  if (error) throw new Error(`cash_donations: ${error.message}`);
}

export async function anularEfectivo(id: string) {
  const { error } = await supabase
    .from("cash_donations")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", id)
    .is("voided_at", null);
  if (error) throw new Error(`cash_donations: ${error.message}`);
}
