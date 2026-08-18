import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
 *
 * La hoja tiene dos secciones apiladas: arriba el boleto (negro, con el QR),
 * abajo una franja blanca con los patrocinadores y la info de entrega de
 * kits, calcando el talón impreso. Van en la misma página —no en dos— para
 * que en el correo y al guardarlo en el teléfono sea un solo PDF corto.
 */

const AMBAR = rgb(0.914, 0.651, 0.176); // #e9a62d
const NEGRO = rgb(0.04, 0.04, 0.04);
const GRIS = rgb(0.45, 0.45, 0.45);
const GRIS_CLARO = rgb(0.85, 0.85, 0.85);

const ANCHO = 595;
const ALTO_TICKET = 300;
const ALTO_PATROCINADORES = 260;
const ALTO_TOTAL = ALTO_TICKET + ALTO_PATROCINADORES;

// TODO: si algún día hay eventos con logística de entrega distinta, esto
// debería venir de la fila del evento en vez de estar fijo aquí.
const ENTREGA_LINEA_1 = "Miércoles 7 de octubre · 2:00 pm – 7:00 pm";
const ENTREGA_LINEA_2 = "El lugar se anunciará en nuestras redes sociales @bda_durango";

// La imagen vive en /public para que Vercel siempre la incluya en el build,
// a diferencia de una carpeta arbitraria que el file tracing podría podar.
const RUTA_PATROCINADORES = path.join(process.cwd(), "public", "boleto", "patrocinadores.png");

// Portada: página extra antes del boleto. Mismo criterio de ubicación que
// patrocinadores.png, para que el file tracing de Vercel la incluya siempre.
const RUTA_PORTADA = path.join(process.cwd(), "public", "boleto", "portada.png");

export async function generarBoletoPdf(boleto: BoletoCompleto): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // ── Portada (página 1) ────────────────────────────────────────────────
  // Imagen suelta, a todo lo ancho, con su propio aspect ratio (no se
  // recorta ni se estira). Va como página aparte para no competir con el
  // negro del boleto ni con el QR.
  const bytesPortada = await readFile(RUTA_PORTADA);
  const imagenPortada = await pdf.embedPng(bytesPortada);
  const altoPortada = (imagenPortada.height / imagenPortada.width) * ANCHO;
  const paginaPortada = pdf.addPage([ANCHO, altoPortada]);
  paginaPortada.drawImage(imagenPortada, {
    x: 0, y: 0, width: ANCHO, height: altoPortada,
  });

  // ── Boleto (página 2) ───────────────────────────────────────────────
  // Media carta horizontal + franja de patrocinadores abajo. Sigue siendo
  // una sola página: se lee bien en el teléfono, que es donde lo va a traer
  // casi todo el mundo.
  const pagina = pdf.addPage([ANCHO, ALTO_TOTAL]);
  const { width, height } = pagina.getSize();

  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);

  // Sección negra, arriba de esta página.
  pagina.drawRectangle({ x: 0, y: ALTO_PATROCINADORES, width, height: ALTO_TICKET, color: NEGRO });
  pagina.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: AMBAR });

  const nombre = [boleto.nombre, boleto.apellidos].filter(Boolean).join(" ") || "Por activar";

  pagina.drawText(boleto.evento_nombre.toUpperCase(), {
    x: 32, y: height - 48, size: 15, font: negrita, color: AMBAR,
  });
  pagina.drawText(nombre.toUpperCase(), {
    x: 32, y: height - 88, size: 22, font: negrita, color: rgb(1, 1, 1),
  });

  // Si la orden trae motivo_cortesia (no null), el boleto es de cortesía.
  // Se marca con una etiqueta en la esquina superior derecha: es el único
  // espacio libre entre la barra ámbar de arriba y el QR.
  if (boleto.motivo_cortesia) {
    const etiquetaAncho = 92;
    const etiquetaAlto = 20;
    const etX = width - etiquetaAncho - 32;
    const etY = height - 20 - etiquetaAlto;

    pagina.drawRectangle({
      x: etX, y: etY, width: etiquetaAncho, height: etiquetaAlto, color: AMBAR,
    });
    pagina.drawText("CORTESÍA", {
      x: etX + 14, y: etY + 6, size: 10, font: negrita, color: NEGRO,
    });
  }

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
  const imagenQr = await pdf.embedPng(png);
  const lado = 150;
  const qrX = width - lado - 32;
  const qrY = height - lado - 60;

  pagina.drawRectangle({
    x: qrX - 8, y: qrY - 8, width: lado + 16, height: lado + 16, color: rgb(1, 1, 1),
  });
  pagina.drawImage(imagenQr, { x: qrX, y: qrY, width: lado, height: lado });

  pagina.drawText("Preséntalo en la entrega de kits", {
    x: qrX - 8, y: qrY - 22, size: 8, font: normal, color: GRIS,
  });
  pagina.drawText("con una identificación oficial", {
    x: qrX - 8, y: qrY - 33, size: 8, font: normal, color: GRIS,
  });

  pagina.drawText("GENEROSITY IS THE NEW REVOLUTION", {
    x: 32, y: ALTO_PATROCINADORES + 24, size: 8, font: negrita, color: AMBAR,
  });

  // ── Franja de patrocinadores (sección blanca, abajo) ──────────────────
  const margenX = 32;
  const anchoDisponible = width - margenX * 2;
  let yPanel = ALTO_PATROCINADORES - 20;

  pagina.drawText("ENTREGA DE KIT", {
    x: margenX, y: yPanel, size: 9, font: negrita, color: AMBAR,
  });
  yPanel -= 16;

  pagina.drawText(ENTREGA_LINEA_1, {
    x: margenX, y: yPanel, size: 11, font: negrita, color: NEGRO,
  });
  yPanel -= 15;

  pagina.drawText(ENTREGA_LINEA_2, {
    x: margenX, y: yPanel, size: 8, font: normal, color: GRIS,
  });
  yPanel -= 16;

  pagina.drawRectangle({
    x: margenX, y: yPanel, width: anchoDisponible, height: 1, color: GRIS_CLARO,
  });
  yPanel -= 16;

  pagina.drawText("CON EL APOYO DE", {
    x: margenX, y: yPanel, size: 8, font: negrita, color: GRIS,
  });
  yPanel -= 12;

  const bytesPatrocinadores = await readFile(RUTA_PATROCINADORES);
  const imagenPatrocinadores = await pdf.embedPng(bytesPatrocinadores);

  const margenInferior = 18;
  const altoDisponible = yPanel - margenInferior;
  const escala = Math.min(
    anchoDisponible / imagenPatrocinadores.width,
    altoDisponible / imagenPatrocinadores.height,
  );
  const logosAncho = imagenPatrocinadores.width * escala;
  const logosAlto = imagenPatrocinadores.height * escala;

  pagina.drawImage(imagenPatrocinadores, {
    x: margenX + (anchoDisponible - logosAncho) / 2,
    y: margenInferior,
    width: logosAncho,
    height: logosAlto,
  });

  return pdf.save();
}