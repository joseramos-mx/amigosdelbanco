import { NextResponse } from "next/server";
import { COOKIE_PASE, verificarPase } from "@/lib/run/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Canjea la liga del equipo por una cookie.
 *
 * Es un handler y no una página porque solo aquí se pueden escribir cookies.
 * Al abrir la liga una vez, el teléfono queda autorizado hasta que venza el
 * pase — nadie tiene que volver a buscar el mensaje de WhatsApp a media
 * entrega de kits.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("p");
  const pase = verificarPase(token);

  if (!pase || !token) {
    return NextResponse.redirect(new URL("/run/pase-invalido", url.origin));
  }

  const destino = pase.rol === "admin" ? "/run/staff" : "/run/staff/escaner";
  const respuesta = NextResponse.redirect(new URL(destino, url.origin));

  respuesta.cookies.set(COOKIE_PASE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: pase.expiraEn,
  });

  return respuesta;
}
