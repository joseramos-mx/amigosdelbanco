"use server";

import { paseActual } from "@/lib/run/staff";
import {
  agregarEfectivo,
  anularEfectivo,
  resumenEfectivo,
  type ResumenEfectivo,
} from "@/lib/run/efectivo";

// Solo admin. Se valida en el servidor en CADA acción (no basta con esconder el botón).
async function exigirAdmin() {
  const pase = await paseActual();
  if (pase?.rol !== "admin") throw new Error("No autorizado");
  // Si tu pase trae nombre, se guarda quién capturó; si no, queda vacío.
  const nombre = (pase as unknown as { nombre?: string } | null)?.nombre;
  return typeof nombre === "string" ? nombre : null;
}

export async function cargarEfectivo(): Promise<ResumenEfectivo> {
  await exigirAdmin();
  return resumenEfectivo();
}

export async function sumarEfectivo(pesos: number, nombre?: string): Promise<ResumenEfectivo> {
  const quien = await exigirAdmin();
  if (!Number.isFinite(pesos)) throw new Error("Monto inválido");
  await agregarEfectivo(Math.round(pesos * 100), nombre ?? null, quien);
  return resumenEfectivo();
}

export async function anularEfectivoAction(id: string): Promise<ResumenEfectivo> {
  await exigirAdmin();
  await anularEfectivo(id);
  return resumenEfectivo();
}
