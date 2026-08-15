import { NextResponse } from "next/server";
import { paseDeRequest, puede } from "@/lib/run/staff";
import { registrarEntregaKit, type ResultadoCheckin } from "@/lib/run/padron";
import { verificarTokenQr } from "@/lib/run/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Entrega de kits.
 *
 * Recibe un lote, no un escaneo suelto: el escáner encola lo que lee mientras
 * no hay red y lo manda todo junto cuando vuelve. Cada entrada es idempotente
 * —el segundo registro del mismo boleto devuelve `repetido` con la hora del
 * primero— así que reenviar la cola completa no rompe nada.
 */

type Entrada = { qr: string; notas?: string };

export async function POST(request: Request) {
  const pase = await paseDeRequest(request);
  if (!puede(pase, "escaner")) {
    return NextResponse.json({ error: "Pase inválido o vencido" }, { status: 401 });
  }

  let cuerpo: { escaneos?: Entrada[] };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const escaneos = Array.isArray(cuerpo.escaneos) ? cuerpo.escaneos.slice(0, 200) : [];
  if (!escaneos.length) {
    return NextResponse.json({ error: "No mandaste escaneos" }, { status: 400 });
  }

  const resultados: (ResultadoCheckin & { qr: string })[] = [];

  for (const escaneo of escaneos) {
    const verificado = verificarTokenQr(String(escaneo.qr ?? ""));
    if (!verificado.ok) {
      resultados.push({ qr: escaneo.qr, boletoId: "", resultado: "no_encontrado" });
      continue;
    }

    try {
      const r = await registrarEntregaKit(
        verificado.boletoId,
        pase!.nombre || pase!.rol,
        escaneo.notas,
      );
      resultados.push({ ...r, qr: escaneo.qr });
    } catch (err) {
      console.error("[run/checkin]", err);
      // Se responde 500 para que el escáner conserve el lote en su cola y lo
      // reintente; como es idempotente, reintentar es seguro.
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
    }
  }

  return NextResponse.json({ resultados });
}
