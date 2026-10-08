import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { resumenDonaciones, type Alcance } from "@/lib/run/overlay-donaciones";

export const dynamic = "force-dynamic";

// OBS / vMix no tienen sesión, así que el acceso se protege con una clave en la URL:
//   OVERLAY_KEY=algo-largo-y-secreto   (variable de entorno)
//   /overlay/lista?key=algo-largo-y-secreto
function claveValida(recibida: string | null): boolean {
    const esperada = process.env.OVERLAY_KEY;
    if (!esperada) return process.env.NODE_ENV !== "production"; // en producción exige clave
    if (!recibida) return false;
    const a = Buffer.from(recibida);
    const b = Buffer.from(esperada);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    if (!claveValida(searchParams.get("key"))) {
        return NextResponse.json({ error: "no autorizado" }, { status: 401 });
    }

    const alcance: Alcance = searchParams.get("alcance") === "hoy" ? "hoy" : "todo";
    const limite = Math.min(Math.max(Number(searchParams.get("limite")) || 10, 1), 25);

    try {
        const datos = await resumenDonaciones(alcance, limite);
        return NextResponse.json(datos, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
        console.error("[overlay] error consultando donaciones", e);
        return NextResponse.json({ error: "error interno" }, { status: 500 });
    }
}
