import { timingSafeEqual } from "node:crypto";

// Clave opcional en la URL (?key=...). Si no defines OVERLAY_KEY, el endpoint queda abierto.
export function claveValida(recibida: string | null): boolean {
  const esperada = process.env.OVERLAY_KEY;
  if (!esperada) return true;
  if (!recibida) return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
