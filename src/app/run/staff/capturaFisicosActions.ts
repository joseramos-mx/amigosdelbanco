"use server";
import { capturarFisico, type DatosCaptura } from "@/lib/run/captura-fisicos";

export async function capturarFisicoAction(
  datos: DatosCaptura
): Promise<{ ok: true; ordenId: string } | { ok: false; error: string }> {
  try {
    const res = await capturarFisico(datos);
    return { ok: true, ordenId: res.ordenId };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
