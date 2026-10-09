import { NextResponse } from "next/server";
import { claveValida } from "@/lib/run/overlay-auth";
import { resumenEfectivo } from "@/lib/run/efectivo";

export const dynamic = "force-dynamic";

// Devuelve totales y las últimas donaciones (nombre del donador + monto).
// Nunca devuelve quién capturó (created_by): eso es solo del panel de admin.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (!claveValida(searchParams.get("key"))) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  try {
    const r = await resumenEfectivo();
    return NextResponse.json(
      {
        ahora: r.ahora,
        totalCentavos: r.totalCentavos,
        hoyCentavos: r.hoyCentavos,
        cantidad: r.cantidad,
        ultimas: r.recientes.map((x) => ({ id: x.id, nombre: x.nombre, centavos: x.centavos })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[overlay-efectivo] error", e);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}
