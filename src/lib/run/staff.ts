import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Acceso del equipo el día del evento.
 *
 * Sin cuentas ni contraseñas: cada persona recibe una liga con un código
 * firmado y con eso entra. Un equipo de voluntarios rota, se cambia el día
 * antes y nadie va a recordar una contraseña a las seis de la mañana en una
 * explanada; dar de alta usuarios para eso es fricción sin ganancia.
 *
 * El código se guarda en cookie al abrir la liga, así que se entra una vez y
 * el dispositivo queda listo. La firma se valida en cada petición.
 *
 * Revocar: los códigos traen vencimiento corto. Para invalidar todos de golpe
 * —un teléfono perdido a media entrega de kits— se sube RUN_STAFF_EPOCH y
 * los anteriores dejan de servir.
 */

export type RolStaff = "escaner" | "admin";

export type Pase = {
  rol: RolStaff;
  nombre: string;
  expiraEn: Date;
};

export const COOKIE_PASE = "run_pase";

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function secreto(): string {
  const s = process.env.RUN_TOKEN_SECRET;
  if (!s || s.length < 32) {
    throw new Error("RUN_TOKEN_SECRET no está configurada o es muy corta.");
  }
  return s;
}

/** Sube este número en el entorno para invalidar todos los pases emitidos. */
function epoca(): string {
  return process.env.RUN_STAFF_EPOCH ?? "1";
}

function firmar(payload: string): string {
  return b64url(
    createHmac("sha256", `${secreto()}:staff:${epoca()}`).update(payload).digest(),
  );
}

export function crearPase(rol: RolStaff, nombre: string, expiraEn: Date): string {
  const payload = b64url(
    JSON.stringify({ r: rol, n: nombre, e: Math.floor(expiraEn.getTime() / 1000) }),
  );
  return `${payload}.${firmar(payload)}`;
}

export function verificarPase(token: string | undefined | null): Pase | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [payload, firma] = partes;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return null;
  }

  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (d.r !== "escaner" && d.r !== "admin") return null;
    const expiraEn = new Date(d.e * 1000);
    if (expiraEn.getTime() < Date.now()) return null;
    return { rol: d.r, nombre: String(d.n ?? ""), expiraEn };
  } catch {
    return null;
  }
}

/** Pase de la cookie, o null. Para páginas y handlers del área de staff. */
export async function paseActual(): Promise<Pase | null> {
  const cookie = (await cookies()).get(COOKIE_PASE)?.value;
  return verificarPase(cookie);
}

/** El escáner es lo mínimo; admin puede todo lo que puede el escáner. */
export function puede(pase: Pase | null, rol: RolStaff): boolean {
  if (!pase) return false;
  if (rol === "escaner") return true;
  return pase.rol === "admin";
}

/** Autoriza un handler por cookie o por encabezado, para el escáner offline. */
export function paseDeRequest(request: Request): Pase | null {
  const encabezado = request.headers.get("x-run-pase");
  if (encabezado) return verificarPase(encabezado);

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_PASE}=`))
    ?.slice(COOKIE_PASE.length + 1);

  return verificarPase(cookie ? decodeURIComponent(cookie) : null);
}
