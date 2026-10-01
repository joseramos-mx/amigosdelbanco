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

/**
 * Buzones internos para alertas de fallos en flujos críticos (dinero, cupo).
 * Acepta uno o varios correos separados por coma, p. ej.:
 *   DEV_ALERT_EMAIL="dev1@dondesea.com,dev2@dondesea.com"
 */
const DEV_ALERT_EMAILS = (process.env.DEV_ALERT_EMAIL ?? "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

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
          —nombre y talla—.
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

/**
 * Alerta interna para un desarrollador cuando algo falla en un flujo
 * crítico (dinero, cupo). No va al comprador — va a `DEV_ALERT_EMAIL`.
 *
 * Se traga sus propios errores a propósito: una alerta que falla no debe
 * tumbar el webhook o el proceso que la disparó. Si no hay Resend o no hay
 * buzón configurado, al menos queda en los logs del servidor.
 */
export async function enviarAlertaDev(params: {
  asunto: string;
  contexto: Record<string, unknown>;
}): Promise<void> {
  if (!resend || DEV_ALERT_EMAILS.length === 0) {
    console.error("[alerta-dev]", params.asunto, params.contexto);
    return;
  }

  const filas = Object.entries(params.contexto)
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:4px 12px 4px 0;color:#a3a3a3;vertical-align:top;white-space:nowrap;">${k}</td>
          <td style="padding:4px 0;font-family:monospace;font-size:13px;word-break:break-all;">${String(v)}</td>
        </tr>`,
    )
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: DEV_ALERT_EMAILS,
      subject: `[Alerta] ${params.asunto}`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;padding:16px;">
          <h2 style="margin:0 0 12px;font-size:16px;">${params.asunto}</h2>
          <table style="border-collapse:collapse;">${filas}</table>
        </div>
      `,
    });
    if (error) {
      console.error("[alerta-dev] Resend rechazó la alerta:", error.message, params);
    }
  } catch (err) {
    console.error("[alerta-dev] no se pudo mandar la alerta:", err, params);
  }
}
/**
 * Aviso de cambio: el evento pasó a ser gratuito.
 */
const ESTADIO_CALIENTE_URL =
  process.env.ESTADIO_CALIENTE_URL ?? "https://www.google.com/maps/search/?api=1&query=Estadio+Caliente+Durango";

export async function enviarAvisoEventoGratuito(params: {
  correo: string;
  folio: string;
  totalCentavos: number;
  detalleReembolso?: string;
}): Promise<Resultado> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const img = (archivo: string) => `${origen()}/correos/${archivo}`;
  const p = "font-size:15px;line-height:1.6;color:#171717;margin:0 0 16px;";
  const hora = (h: string, t: string) => `
    <tr>
      <td style="vertical-align:top;padding:0 10px 10px 0;color:#e9a62d;font-size:18px;line-height:1.3;">•</td>
      <td style="padding:0 0 10px;font-size:15px;line-height:1.55;color:#404040;">
        <strong style="color:#171717;">${h}</strong> — ${t}
      </td>
    </tr>`;

  const html = `
    <div style="background:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">

        <!-- 1. Encabezado -->
        <tr><td>
          <img src="${img("gratuito-header.png")}" width="560" alt="9 de octubre — Festival de la Generosidad + Social Run"
               style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
        </td></tr>

        <tr><td style="padding:24px 24px 0;">
          <p style="${p}">
            Tenemos buenas noticias: el <strong>Festival de la Generosidad + Social Run</strong>
            del <strong>9 de octubre</strong> ahora es <strong>totalmente gratuito</strong>.
          </p>
          <p style="${p}">
            Por eso te vamos a <strong>reembolsar el dinero</strong> de tu inscripción
            (folio <strong>${params.folio}</strong>, <strong>${formatMxn(params.totalCentavos)}</strong>).
            ${params.detalleReembolso ?? "Te lo regresaremos por transferencia a la misma cuenta desde la que hiciste el depósito; no necesitas hacer ningún trámite."}
          </p>
        </td></tr>

        <!-- 2. Botón Estadio Caliente -->
        <tr><td align="center" style="padding:8px 24px 24px;">
          <a href="${ESTADIO_CALIENTE_URL}" target="_blank" style="display:inline-block;">
            <img src="${img("gratuito-estadio.png")}" width="360"
                 alt="Visita el Estadio Caliente para obtener tus cortesías"
                 style="display:block;width:360px;max-width:100%;height:auto;border:0;" />
          </a>
        </td></tr>

        <tr><td style="padding:0 24px 20px;">
          <p style="font-size:14px;line-height:1.6;color:#171717;margin:0;padding:12px 16px;background:#fff7e6;border-left:4px solid #e9a62d;border-radius:4px;">
            <strong>Importante:</strong> la cortesía da acceso al evento, pero <strong>no incluye el kit</strong> del corredor.
          </p>
        </td></tr>

        <tr><td style="padding:0 24px;">
          <p style="font-size:16px;margin:0 0 12px;color:#171717;"><strong>Así será el día:</strong></p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            ${hora("5:00 PM", "Concentración en la antigua Estación de Ferrocarril.")}
            ${hora("6:00 PM", "Corremos juntos a ritmo moderado, acompañados de música. Circuito de 3 km y 6 km sobre Avenida Gómez Morín.")}
            ${hora("7:00 – 10:00 PM", "Festival de la Generosidad: música en vivo (rave, ska, oldies y ranchero), comida y más.")}
          </table>

          <p style="${p}">
            Te invitamos a hacer una acción buena (ayudar a alguien) ese día y subir una foto
            a redes con el hashtag <strong>#GGDURANGO</strong>, etiquetando a
            <strong>@bda_durango</strong>. La meta: que el 9 de octubre sea el día duranguense
            de la generosidad.
          </p>
          <p style="font-size:14px;line-height:1.6;color:#737373;margin:0 0 24px;">
             Más información en
            <a href="https://bancodurango.org" style="color:#737373;">bancodurango.org</a>.<br />
            Gracias por apoyar la construcción del Banco de Alimentos.
          </p>
        </td></tr>

        <!-- 3. Franja de patrocinadores -->
        <tr><td>
          <img src="${img("gratuito-patrocinadores.png")}" width="560"
               alt="Banco de Alimentos de Durango y patrocinadores"
               style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
        </td></tr>

      </table>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    ...(RESPONDER_A ? { replyTo: RESPONDER_A } : {}),
    to: params.correo,
    subject: `¡El Social Run ahora es gratuito! Te devolvemos tu pago — folio ${params.folio}`,
    html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}