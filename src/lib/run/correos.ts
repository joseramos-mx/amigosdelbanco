import "server-only";
import { Resend } from "resend";
import { formatMxn } from "@/lib/donation";
import type { BoletoCompleto } from "./activacion";

/**
 * Correo transaccional del módulo de inscripciones.
 *
 * Solo transaccional: nada de campañas ni listas. Si no hay RESEND_API_KEY,
 * las funciones no truenan — devuelven `ok: false` y el cron sigue su
 * trabajo, que es liberar cupo.
 */

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || "Banco de Alimentos <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;
/**
 * Dirección a la que van las respuestas.
 *
 * Se manda desde una dirección de la organización, pero esa no necesita ser
 * un buzón: enviar lo autoriza el DNS del dominio, no la existencia de una
 * bandeja. Lo que sí conviene es que quien conteste llegue a alguien, y para
 * eso está esto — si no se configura, contestar rebota.
 */
const RESPONDER_A = process.env.RESEND_REPLY_TO;


type Resultado = { ok: boolean; error?: string };

function plantilla(titulo: string, cuerpo: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717;">
      <h1 style="font-size:20px;margin:0 0 16px;">${titulo}</h1>
      ${cuerpo}
      <p style="font-size:13px;line-height:1.5;color:#a3a3a3;margin:24px 0 0;">
        Social Run 2026 — Generous Generation · Banco de Alimentos de Durango A.C.
      </p>
    </div>
  `;
}

export async function enviarRecordatorioVencimiento(params: {
  correo: string;
  folio: string;
  totalCentavos: number;
  venceEn: Date;
  referencia: string | null;
}): Promise<Resultado> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const vence = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(params.venceEn);

  const { error } = await resend.emails.send({
    from: FROM,
    ...(RESPONDER_A ? { replyTo: RESPONDER_A } : {}),
    to: params.correo,
    subject: `Tu lugar en el Social Run vence pronto — folio ${params.folio}`,
    html: plantilla(
      "Tu referencia de pago está por vencer",
      `
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Apartamos tu lugar con el folio <strong>${params.folio}</strong> por
          <strong>${formatMxn(params.totalCentavos)}</strong>, pero la referencia
          vence el <strong>${vence}</strong>. Si no se registra el pago antes,
          el lugar se libera para alguien más.
        </p>
        ${params.referencia
        ? `<p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
                 Referencia OXXO: <strong style="font-family:monospace;">${params.referencia}</strong>
               </p>`
        : ""
      }
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0;">
          Si ya pagaste, ignora este correo: la confirmación puede tardar unas horas
          en llegarnos desde la tienda.
        </p>
      `,
    ),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function origen(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://bancodurango.org").replace(/\/+$/, "");
}

/**
 * Liga de activación, una por boleto.
 *
 * Se manda a quien compró, no al corredor: en una compra de equipo, quien
 * paga es quien reparte. Cada liga lleva su token firmado.
 */
export async function enviarLigasActivacion(params: {
  correo: string;
  folio: string;
  tokens: string[];
}): Promise<Resultado> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const varias = params.tokens.length > 1;
  const ligas = params.tokens
    .map(
      (t, i) => `
        <p style="margin:0 0 12px;">
          <a href="${origen()}/run/activar/${t}"
             style="display:inline-block;background:#e9a62d;color:#0a0a0a;font-weight:700;
                    text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">
            Llenar datos${varias ? ` — corredor ${i + 1}` : ""}
          </a>
        </p>`,
    )
    .join("");

  const { error } = await resend.emails.send({
    from: FROM,
    ...(RESPONDER_A ? { replyTo: RESPONDER_A } : {}),
    to: params.correo,
    subject: `Tu lugar en el Social Run 2026 está confirmado — folio ${params.folio}`,
    html: plantilla(
      "Pago confirmado",
      `
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 20px;">
          Listo, tu lugar quedó apartado con el folio <strong>${params.folio}</strong>.
          Falta un paso: llenar los datos de ${varias ? "cada corredor" : "corredor"}
          —nombre, talla, contacto de emergencia y la carta responsiva—.
        </p>
        ${ligas}
        <p style="font-size:14px;line-height:1.6;color:#737373;margin:20px 0 0;">
          ${varias
        ? "Cada botón es para una persona distinta: reparte las ligas entre tu equipo."
        : "Al terminar te mandamos tu boleto con el código QR."
      }
        </p>
      `,
    ),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Acceso de staff recién dado de alta: contraseña temporal + liga de login.
 *
 * Se manda a la persona que se registró (admin, escáner o vendedor), no a
 * quien la dio de alta. La contraseña va en texto plano porque es la única
 * forma de entregarla; por eso se le pide cambiarla al entrar.
 */
export async function enviarAccesoStaff(params: {
  correo: string;
  nombre: string;
  rol: "admin" | "escaner" | "vendedor";
  contrasenaTemporal: string;
}): Promise<Resultado> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const etiquetaRol: Record<typeof params.rol, string> = {
    admin: "administrador",
    escaner: "escáner de kits",
    vendedor: "punto de venta",
  };

  const { error } = await resend.emails.send({
    from: FROM,
    ...(RESPONDER_A ? { replyTo: RESPONDER_A } : {}),
    to: params.correo,
    subject: "Tu acceso al staff del Social Run 2026",
    html: plantilla(
      "Ya tienes acceso",
      `
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          ${params.nombre}, te dimos de alta como <strong>${etiquetaRol[params.rol]}</strong>
          para el Social Run 2026. Estos son tus datos para entrar:
        </p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#a3a3a3;width:110px;">Correo</td>
            <td style="padding:8px 0;font-size:15px;color:#171717;font-family:monospace;">${params.correo}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#a3a3a3;">Contraseña</td>
            <td style="padding:8px 0;font-size:15px;color:#171717;font-family:monospace;">${params.contrasenaTemporal}</td>
          </tr>
        </table>
        <p style="margin:0 0 20px;">
          <a href="${origen()}/run/login"
             style="display:inline-block;background:#e9a62d;color:#0a0a0a;font-weight:700;
                    text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">
            Iniciar sesión
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;color:#737373;margin:0;">
          Es una contraseña temporal — al entrar te vamos a pedir que la cambies
          por una tuya. No la compartas por un canal que no controles.
        </p>
      `,
    ),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Boleto listo, después de activar. */
export async function enviarBoleto(params: {
  correo: string;
  boleto: BoletoCompleto;
  token: string;
}): Promise<Resultado> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(params.boleto.fecha_carrera);

  const { error } = await resend.emails.send({
    from: FROM,
    ...(RESPONDER_A ? { replyTo: RESPONDER_A } : {}),
    to: params.correo,
    subject: `Tu boleto del Social Run 2026 — ${params.boleto.folio}`,
    html: plantilla(
      "Nos vemos en la salida",
      `
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 20px;">
          ${params.boleto.nombre ?? ""}, tu inscripción quedó completa.
          <br />${fecha}<br />${params.boleto.sede}, ${params.boleto.ciudad}
        </p>
        <p style="margin:0 0 20px;">
          <a href="${origen()}/api/run/boleto/${params.token}/pdf"
             style="display:inline-block;background:#e9a62d;color:#0a0a0a;font-weight:700;
                    text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;">
            Descargar mi boleto
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;color:#737373;margin:0;">
          Preséntalo en la entrega de kits junto con una identificación oficial.
          El dorsal se te asigna ahí mismo, no viaja en el correo.
        </p>
      `,
    ),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}