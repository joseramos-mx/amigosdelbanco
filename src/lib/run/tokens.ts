import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de activación del boleto.
 *
 * No se usa el id del boleto como liga: el correo se reenvía, se pega en
 * WhatsApp y termina donde sea. El token va firmado, así que un id filtrado
 * no sirve para activar nada.
 *
 *   payload = base64url({ b: boletoId, e: expiraTimestamp })
 *   firma   = base64url(hmacSha256(secreto, payload))
 *   token   = payload + "." + firma
 *
 * El mismo esquema sirve para el QR del boleto (Fase 2) con otro payload.
 */

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64url");

function secreto(): string {
  const s = process.env.RUN_TOKEN_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "RUN_TOKEN_SECRET no está configurada o es muy corta (mínimo 32 caracteres). " +
        "Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return s;
}

/**
 * Separación de dominio: cada uso tiene su propia derivación del secreto, así
 * que un token de activación no sirve como QR de entrada ni al revés. Sin
 * esto, quien tuviera su liga de activación podría fabricar el pase de kit.
 */
function firmar(payload: string, dominio = "activacion"): string {
  return b64url(
    createHmac("sha256", `${secreto()}:${dominio}`).update(payload).digest(),
  );
}

export function crearTokenActivacion(boletoId: string, expiraEn: Date): string {
  const payload = b64url(
    JSON.stringify({ b: boletoId, e: Math.floor(expiraEn.getTime() / 1000) }),
  );
  return `${payload}.${firmar(payload)}`;
}

export type TokenVerificado =
  | { ok: true; boletoId: string; expiraEn: Date }
  | { ok: false; motivo: "formato" | "firma" | "expirado" };

/**
 * Verifica firma y vigencia **antes** de tocar la base de datos: un token
 * inválido no debe costar ni una consulta.
 */
export function verificarTokenActivacion(token: string): TokenVerificado {
  const partes = token.split(".");
  if (partes.length !== 2) return { ok: false, motivo: "formato" };
  const [payload, firma] = partes;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (
    esperada.length !== recibida.length ||
    !timingSafeEqual(esperada, recibida)
  ) {
    return { ok: false, motivo: "firma" };
  }

  let datos: { b?: unknown; e?: unknown };
  try {
    datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, motivo: "formato" };
  }

  if (typeof datos.b !== "string" || typeof datos.e !== "number") {
    return { ok: false, motivo: "formato" };
  }

  const expiraEn = new Date(datos.e * 1000);
  if (expiraEn.getTime() < Date.now()) return { ok: false, motivo: "expirado" };

  return { ok: true, boletoId: datos.b, expiraEn };
}

/**
 * Token del QR del boleto.
 *
 * No expira: el boleto vale el día de la carrera y el escáner valida contra
 * el estado en la base, no contra una fecha dentro del token. Va firmado con
 * su propio dominio, así que no se puede intercambiar con el de activación.
 */
export function crearTokenQr(boletoId: string): string {
  const payload = b64url(JSON.stringify({ b: boletoId }));
  return `${payload}.${firmar(payload, "qr")}`;
}

export type QrVerificado =
  | { ok: true; boletoId: string }
  | { ok: false; motivo: "formato" | "firma" };

/**
 * Verifica el QR sin tocar la base. El escáner del día del evento trabaja sin
 * conexión: valida la firma en el dispositivo y coteja contra el padrón que
 * cacheó antes de abrir.
 */
export function verificarTokenQr(token: string): QrVerificado {
  const partes = token.split(".");
  if (partes.length !== 2) return { ok: false, motivo: "formato" };
  const [payload, firma] = partes;

  const esperada = Buffer.from(firmar(payload, "qr"));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return { ok: false, motivo: "firma" };
  }

  try {
    const datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof datos.b !== "string") return { ok: false, motivo: "formato" };
    return { ok: true, boletoId: datos.b };
  } catch {
    return { ok: false, motivo: "formato" };
  }
}
