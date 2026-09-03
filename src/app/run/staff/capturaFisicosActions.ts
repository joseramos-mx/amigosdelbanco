"use server";
import { revalidatePath } from "next/cache";
import { capturarFisico, type DatosCaptura } from "@/lib/run/captura-fisicos";
import { paseActual } from "@/lib/run/staff";

export async function capturarFisicoAction(
  datos: DatosCaptura
): Promise<{ ok: true; ordenId: string } | { ok: false; error: string }> {
  try {
    const pase = await paseActual();
    if (!pase) throw new Error("No tienes sesión activa");

    const res = await capturarFisico(datos, pase.id);

    revalidatePath("/run/staff/vendedor");

    return { ok: true, ordenId: res.ordenId };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}