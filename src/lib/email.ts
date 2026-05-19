import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || "Banco de Alimentos <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendPortalLink(email: string, portalUrl: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Gestiona tu donación — Banco de Alimentos Durango",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717;">
        <h1 style="font-size:20px;margin:0 0 16px;">Gestiona tu donación</h1>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 24px;">
          Hola, hicimos clic en "Gestionar mi donación" en
          <a href="https://badurango.org" style="color:#1d4dfc;">Banco de Alimentos Durango</a>.
          Usa el siguiente enlace para actualizar tu tarjeta, cancelar tu donación mensual o ver tu historial.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${portalUrl}"
             style="display:inline-block;background:#fcb51d;color:#fff;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:9999px;font-size:15px;">
            Abrir mi panel
          </a>
        </p>
        <p style="font-size:13px;line-height:1.5;color:#a3a3a3;margin:0;">
          Este enlace es de un solo uso y expira pronto. Si no solicitaste este correo, puedes ignorarlo.
        </p>
      </div>
    `,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
