import "server-only";
import { Resend } from "resend";
import { formatMxn } from "@/lib/donation";

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
        ${
          params.referencia
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
