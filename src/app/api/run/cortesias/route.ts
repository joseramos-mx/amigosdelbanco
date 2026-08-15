import { NextResponse } from "next/server";
import { CupoInsuficiente, obtenerEvento, obtenerTiposBoleto } from "@/lib/run/inscripciones";
import { crearCortesia } from "@/lib/run/cortesias";
import { enviarLigasActivacion } from "@/lib/run/correos";
import { paseDeRequest, puede } from "@/lib/run/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tope por emisión. Arriba de esto conviene revisar qué se está regalando. */
const MAX_POR_CORTESIA = 50;

export async function POST(request: Request) {
  const pase = await paseDeRequest(request);
  if (!puede(pase, "admin")) {
    return NextResponse.json({ error: "Necesitas un pase de coordinación" }, { status: 401 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const correo = String(cuerpo.correo ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const nombre = String(cuerpo.nombre ?? "").trim().slice(0, 120);
  if (nombre.length < 3) {
    return NextResponse.json({ error: "Escribe a nombre de quién va" }, { status: 400 });
  }

  // El motivo es obligatorio a propósito: es lo que el contador va a
  // preguntar cuando vea boletos sin cobro en el padrón.
  const motivo = String(cuerpo.motivo ?? "").trim().slice(0, 200);
  if (motivo.length < 3) {
    return NextResponse.json({ error: "Escribe el motivo de la cortesía" }, { status: 400 });
  }

  const cantidad = Number(cuerpo.cantidad ?? 1);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_POR_CORTESIA) {
    return NextResponse.json(
      { error: `La cantidad debe estar entre 1 y ${MAX_POR_CORTESIA}` },
      { status: 400 },
    );
  }

  try {
    const evento = await obtenerEvento();
    if (!evento) return NextResponse.json({ error: "Evento no configurado" }, { status: 503 });

    const tipos = await obtenerTiposBoleto(evento.id);
    const tipoBoleto = cuerpo.tipoBoletoId
      ? tipos.find((t) => t.id === cuerpo.tipoBoletoId)
      : tipos[0];
    if (!tipoBoleto) {
      return NextResponse.json({ error: "Tipo de boleto inválido" }, { status: 400 });
    }

    const cortesia = await crearCortesia({
      evento,
      tipoBoleto,
      cantidad,
      correo,
      nombre,
      motivo,
      emitidaPor: pase!.nombre || pase!.rol,
    });

    // Mismo correo que recibe quien paga: la cortesía recorre el flujo
    // completo, que es justo lo que la hace útil para probar.
    const correoEnviado = await enviarLigasActivacion({
      correo,
      folio: cortesia.folio,
      tokens: cortesia.tokens,
    });

    return NextResponse.json({
      folio: cortesia.folio,
      cantidad,
      correoEnviado: correoEnviado.ok,
      // Se devuelven las ligas para poder repartirlas a mano si el correo no
      // está configurado o rebota.
      ligas: cortesia.tokens.map((t) => `/run/activar/${t}`),
    });
  } catch (err) {
    if (err instanceof CupoInsuficiente) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[run/cortesias]", err);
    return NextResponse.json({ error: "No pudimos emitir la cortesía" }, { status: 500 });
  }
}
