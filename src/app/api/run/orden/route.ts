import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRedirectOrigin } from "@/lib/origin";
import {
  CupoInsuficiente,
  cancelarOrden,
  MAX_BOLETOS_POR_ORDEN,
  VentaCerrada,
  crearOrdenPendiente,
  cupoDisponible,
  guardarSesionStripe,
  obtenerEvento,
  obtenerTiposBoleto,
} from "@/lib/run/inscripciones";
import { crearSesionCheckout } from "@/lib/run/stripe";

export const runtime = "nodejs";

/** Tope del donativo opcional, en pesos. */
const MAX_DONATIVO_MXN = 100_000;

type Body = {
  tipoBoletoId: string;
  cantidad: number;
  correo: string;
  nombre: string;
  telefono?: string;
  donativoMxn?: number;
  factura?: {
    rfc?: string;
    razonSocial?: string;
    usoCfdi?: string;
    regimenFiscal?: string;
    cpFiscal?: string;
    correoFactura?: string;
  };
};

function validar(body: unknown): { ok: true; valor: Body } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Cuerpo inválido" };
  const b = body as Record<string, unknown>;

  const tipoBoletoId = typeof b.tipoBoletoId === "string" ? b.tipoBoletoId : "";
  if (!tipoBoletoId) return { ok: false, error: "Falta el tipo de boleto" };

  const cantidad = Number(b.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_BOLETOS_POR_ORDEN) {
    return { ok: false, error: `La cantidad debe estar entre 1 y ${MAX_BOLETOS_POR_ORDEN}` };
  }

  const correo = typeof b.correo === "string" ? b.correo.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, error: "Correo inválido" };
  }

  const nombre = typeof b.nombre === "string" ? b.nombre.trim().slice(0, 120) : "";
  if (nombre.length < 3) return { ok: false, error: "Escribe tu nombre completo" };

  const donativoMxn = b.donativoMxn === undefined ? 0 : Number(b.donativoMxn);
  if (!Number.isFinite(donativoMxn) || donativoMxn < 0 || donativoMxn > MAX_DONATIVO_MXN) {
    return { ok: false, error: `El donativo debe estar entre $0 y $${MAX_DONATIVO_MXN} MXN` };
  }

  const telefono = typeof b.telefono === "string" ? b.telefono.trim().slice(0, 20) : undefined;
  const factura = (b.factura ?? undefined) as Body["factura"];

  return { ok: true, valor: { tipoBoletoId, cantidad, correo, nombre, telefono, donativoMxn, factura } };
}

export async function POST(request: Request) {
  const resultado = validar(await request.json().catch(() => null));
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 400 });

  const { tipoBoletoId, cantidad, correo, nombre, telefono, donativoMxn, factura } = resultado.valor;

  try {
    const evento = await obtenerEvento();
    if (!evento) {
      return NextResponse.json({ error: "El evento no está configurado." }, { status: 503 });
    }

    const tipoBoleto = (await obtenerTiposBoleto(evento.id)).find((t) => t.id === tipoBoletoId);
    if (!tipoBoleto) {
      return NextResponse.json({ error: "Tipo de boleto inválido" }, { status: 400 });
    }
    if (tipoBoleto.precio_centavos <= 0) {
      return NextResponse.json(
        { error: "El precio de la inscripción todavía no está configurado." },
        { status: 503 },
      );
    }

    // La orden nace apartando cupo: si no alcanza, ni se toca Stripe.
    const orden = await crearOrdenPendiente({
      evento,
      tipoBoleto,
      cantidad,
      correoComprador: correo,
      nombreComprador: nombre,
      telefono,
      donativoCentavos: Math.round((donativoMxn ?? 0) * 100),
      factura,
    });

    // Si Stripe falla, la orden ya apartó cupo: hay que soltarlo de inmediato
    // en vez de dejarlo secuestrado hasta que venza el TTL. Con OXXO eso son
    // hasta tres días de un lugar que nadie está pagando.
    let sesion;
    try {
      sesion = await crearSesionCheckout({
        evento,
        tipoBoleto,
        cantidad,
        orden,
        correo,
        nombre,
        origin: getRedirectOrigin(request),
      });
    } catch (err) {
      await cancelarOrden(orden.id).catch((e) =>
        console.error("[run/orden] no se pudo liberar el cupo:", e),
      );
      throw err;
    }

    await guardarSesionStripe(orden.id, sesion.id);

    return NextResponse.json({ url: sesion.url, folio: orden.folio });
  } catch (err) {
    if (err instanceof CupoInsuficiente) {
      return NextResponse.json({ error: err.message, disponibles: err.disponibles }, { status: 409 });
    }
    if (err instanceof VentaCerrada) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[run/orden] Stripe:", err.message);
      return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 400 });
    }
    console.error("[run/orden]", err);
    return NextResponse.json(
      { error: "No pudimos iniciar tu inscripción. Intenta de nuevo en un momento." },
      { status: 500 },
    );
  }
}

/** Cupo en vivo para el formulario. */
export async function GET() {
  try {
    const evento = await obtenerEvento();
    if (!evento) return NextResponse.json({ error: "Evento no configurado" }, { status: 503 });

    const tipos = await obtenerTiposBoleto(evento.id);
    const conCupo = await Promise.all(
      tipos.map(async (t) => ({
        id: t.id,
        nombre: t.nombre,
        precioCentavos: t.precio_centavos,
        disponibles: await cupoDisponible(t.id),
      })),
    );

    return NextResponse.json({
      evento: {
        nombre: evento.nombre,
        fechaCarrera: evento.fecha_carrera,
        sede: evento.sede,
        ciudad: evento.ciudad,
        estado: evento.estado,
      },
      tiposBoleto: conCupo,
    });
  } catch (err) {
    console.error("[run/orden GET]", err);
    return NextResponse.json({ error: "No pudimos consultar el cupo." }, { status: 500 });
  }
}
