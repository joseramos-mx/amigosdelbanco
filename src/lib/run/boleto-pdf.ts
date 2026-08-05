import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { BoletoCompleto } from "./activacion";
import { crearTokenQr } from "./tokens";

/**
 * PDF del boleto, generado en el servidor.
 *
 * Se arma con pdf-lib en vez de renderizar HTML: no necesita navegador
 * headless, pesa poco y corre igual en una función de Vercel.
 *
 * El QR lleva un token firmado, no el id del boleto. Así el escáner del día
 * del evento puede validarlo **sin conexión** —el wifi de una explanada
 * siempre falla— comprobando la firma contra el padrón que cacheó antes de
 * abrir, en lugar de preguntarle al servidor por cada persona.
 */

const AMBAR = rgb(0.914, 0.651, 0.176); // #e9a62d
const NEGRO = rgb(0.04, 0.04, 0.04);
const GRIS = rgb(0.45, 0.45, 0.45);

export async function generarBoletoPdf(boleto: BoletoCompleto): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  // Media carta horizontal: entra en una hoja normal y se lee bien en el
  // teléfono, que es donde lo va a traer casi todo el mundo.
  const pagina = pdf.addPage([595, 300]);
  const { width, height } = pagina.getSize();

  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);

  pagina.drawRectangle({ x: 0, y: 0, width, height, color: NEGRO });
  pagina.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: AMBAR });

  const nombre = [boleto.nombre, boleto.apellidos].filter(Boolean).join(" ") || "Por activar";

  pagina.drawText(boleto.evento_nombre.toUpperCase(), {
    x: 32, y: height - 48, size: 15, font: negrita, color: AMBAR,
  });
  pagina.drawText(nombre.toUpperCase(), {
    x: 32, y: height - 88, size: 22, font: negrita, color: rgb(1, 1, 1),
  });

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/Monterrey",
  }).format(boleto.fecha_carrera);

  const filas: [string, string][] = [
    ["FOLIO", boleto.folio],
    ["BOLETO", boleto.tipo_nombre],
    ["DORSAL", boleto.dorsal ? String(boleto.dorsal) : "se entrega con el kit"],
    ["TALLA", boleto.talla_playera ?? "—"],
    ["FECHA", fecha],
    ["SEDE", `${boleto.sede}, ${boleto.ciudad}`],
  ];

  let y = height - 125;
  for (const [etiqueta, valor] of filas) {
    pagina.drawText(etiqueta, { x: 32, y, size: 7, font: normal, color: GRIS });
    pagina.drawText(valor, { x: 90, y: y - 1, size: 10, font: negrita, color: rgb(1, 1, 1) });
    y -= 24;
  }

  // ── QR ──────────────────────────────────────────────────────────────
  const png = await QRCode.toBuffer(crearTokenQr(boleto.id), {
    type: "png", width: 420, margin: 1,
    color: { dark: "#0a0a0aff", light: "#ffffffff" },
  });
  const imagen = await pdf.embedPng(png);
  const lado = 150;
  const qrX = width - lado - 32;
  const qrY = height - lado - 60;

  pagina.drawRectangle({
    x: qrX - 8, y: qrY - 8, width: lado + 16, height: lado + 16, color: rgb(1, 1, 1),
  });
  pagina.drawImage(imagen, { x: qrX, y: qrY, width: lado, height: lado });

  pagina.drawText("Preséntalo en la entrega de kits", {
    x: qrX - 8, y: qrY - 22, size: 8, font: normal, color: GRIS,
  });
  pagina.drawText("con una identificación oficial", {
    x: qrX - 8, y: qrY - 33, size: 8, font: normal, color: GRIS,
  });

  pagina.drawText("GENEROSITY IS THE NEW REVOLUTION", {
    x: 32, y: 24, size: 8, font: negrita, color: AMBAR,
  });

  return pdf.save();
}
