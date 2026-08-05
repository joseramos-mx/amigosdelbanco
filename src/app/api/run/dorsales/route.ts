import { NextResponse } from "next/server";
import { obtenerEvento, obtenerTiposBoleto } from "@/lib/run/inscripciones";
import { RangoAgotado, SinRangoDeDorsales, asignarDorsales } from "@/lib/run/padron";
import { paseDeRequest, puede } from "@/lib/run/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Asignación de dorsales. Solo coordinación.
 *
 * Se corre cuando el padrón ya está estable, no en cada activación: el
 * cronometrista pide el listado definitivo con días de anticipación y un
 * dorsal que cambia después de eso es un problema en la mesa de entrega.
 */
export async function POST(request: Request) {
  const pase = paseDeRequest(request);
  if (!puede(pase, "admin")) {
    return NextResponse.json({ error: "Necesitas un pase de coordinación" }, { status: 401 });
  }

  try {
    const evento = await obtenerEvento();
    if (!evento) return NextResponse.json({ error: "Evento no configurado" }, { status: 503 });

    const tipos = await obtenerTiposBoleto(evento.id);
    const resultados = [];
    for (const tipo of tipos) {
      resultados.push({ tipo: tipo.nombre, ...(await asignarDorsales(tipo.id)) });
    }

    return NextResponse.json({ resultados });
  } catch (err) {
    if (err instanceof SinRangoDeDorsales || err instanceof RangoAgotado) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[run/dorsales]", err);
    return NextResponse.json({ error: "No pudimos asignar dorsales" }, { status: 500 });
  }
}
