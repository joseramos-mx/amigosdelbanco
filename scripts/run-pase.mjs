/**
 * Genera ligas de acceso para el equipo del evento.
 *
 *   node --env-file=.env.local scripts/run-pase.mjs --rol=escaner --nombre="Turno mañana" --dias=3
 *   node --env-file=.env.local scripts/run-pase.mjs --rol=admin --nombre="Coordinación" --dias=30
 *
 * Imprime la liga completa. Se manda por WhatsApp a cada persona; al abrirla,
 * el dispositivo queda autorizado hasta que venza.
 *
 * Roles:
 *   escaner  entrega de kits, nada más
 *   admin    panel completo, exportaciones y asignación de dorsales
 *
 * Para invalidar todos los pases emitidos —un teléfono perdido a media
 * jornada— sube RUN_STAFF_EPOCH en el entorno y vuelve a generarlos.
 *
 * OJO: firma con el RUN_TOKEN_SECRET de .env.local, así que el pase solo
 * sirve contra un servidor que use ese mismo secreto — típicamente el
 * local. Para producción usa el endpoint, que firma con el secreto que ya
 * vive allá:
 *
 *   curl -X POST "https://bancodurango.org/api/admin/pase?rol=admin&nombre=Coordinacion&dias=30" \n *        -H "Authorization: Bearer $CRON_SECRET"
 */

import { createHmac } from "node:crypto";

const args = new Map(
  process.argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
);

const SECRETO = process.env.RUN_TOKEN_SECRET;
if (!SECRETO || SECRETO.length < 32) {
  throw new Error("Falta RUN_TOKEN_SECRET (mínimo 32 caracteres)");
}

const rol = String(args.get("rol") ?? "escaner");
if (rol !== "escaner" && rol !== "admin") {
  throw new Error(`Rol inválido: ${rol}. Usa escaner o admin.`);
}

const nombre = String(args.get("nombre") ?? "Sin nombre").slice(0, 60);
const dias = Number(args.get("dias") ?? 3);
if (!Number.isFinite(dias) || dias <= 0 || dias > 365) {
  throw new Error(`Días inválidos: ${args.get("dias")}`);
}

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://bancodurango.org").replace(/\/+$/, "");
const epoca = process.env.RUN_STAFF_EPOCH ?? "1";
const expira = new Date(Date.now() + dias * 86_400_000);

const b64 = (s) => Buffer.from(s).toString("base64url");
const payload = b64(
  JSON.stringify({ r: rol, n: nombre, e: Math.floor(expira.getTime() / 1000) }),
);
const firma = b64(
  createHmac("sha256", `${SECRETO}:staff:${epoca}`).update(payload).digest(),
);
const pase = `${payload}.${firma}`;

const vence = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Monterrey",
}).format(expira);

console.log("");
console.log(`Rol:     ${rol}`);
console.log(`Nombre:  ${nombre}`);
console.log(`Vence:   ${vence}`);
console.log("");
console.log(`${base}/run/staff/acceso?p=${pase}`);
console.log("");
console.log(
  rol === "escaner"
    ? "Mándasela a quien entrega kits. Al abrirla, el teléfono queda listo para escanear."
    : "Acceso completo al panel. No la compartas en grupos.",
);
