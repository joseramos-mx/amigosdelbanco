import { NextResponse } from "next/server";
import { crearPase, type RolStaff } from "@/lib/run/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Emite ligas de acceso para el equipo, desde el servidor.
 *
 * El script local (`npm run run:pase`) firma con el RUN_TOKEN_SECRET de
 * .env.local, que no es el de producción: un pase firmado en la laptop lo
 * rechaza el servidor, y con razón. Generándolos aquí, la firma siempre
 * corresponde y el secreto no tiene que andar copiándose entre máquinas.
 *
 * Se autoriza con CRON_SECRET y no con un pase de staff, porque si hiciera
 * falta un pase para pedir un pase no habría por dónde empezar.
 *
 *   curl -X POST "https://bancodurango.org/api/admin/pase?rol=admin&nombre=Coordinacion&dias=30" \
 *        -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;

  const rol = (params.get("rol") ?? "escaner") as RolStaff;
  if (rol !== "escaner" && rol !== "admin") {
    return NextResponse.json({ error: "Rol inválido: usa escaner o admin" }, { status: 400 });
  }

  const nombre = (params.get("nombre") ?? "Sin nombre").slice(0, 60);

  const dias = Number(params.get("dias") ?? 3);
  if (!Number.isFinite(dias) || dias <= 0 || dias > 365) {
    return NextResponse.json({ error: "Días inválidos (1 a 365)" }, { status: 400 });
  }

  const expiraEn = new Date(Date.now() + dias * 86_400_000);

  try {
    const pase = crearPase(rol, nombre, expiraEn);
    const origen = new URL(request.url).origin;

    return NextResponse.json({
      rol,
      nombre,
      vence: expiraEn.toISOString(),
      liga: `${origen}/run/staff/acceso?p=${pase}`,
    });
  } catch (err) {
    // Pasa si falta RUN_TOKEN_SECRET o es muy corta.
    const mensaje = err instanceof Error ? err.message : "desconocido";
    return NextResponse.json({ error: mensaje }, { status: 503 });
  }
}
