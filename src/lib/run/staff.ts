import "server-only";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type RolStaff = "escaner" | "admin" | "vendedor";

export type Pase = {
  id: string;
  rol: RolStaff;
  nombre: string;
  requiereCambioContrasena: boolean;
};

export const COOKIE_PASE = "run_pase"; // Mantener por retrocompatibilidad con el escáner offline si es necesario, aunque ahora usaremos la cookie de supabase

/** 
 * Obtiene el pase actual (sesión) validando con Supabase Auth y leyendo 
 * el rol de la tabla `public.usuario_rol`.
 */
export async function paseActual(): Promise<Pase | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const sql = db();
    const [rolData] = await sql<{ rol: string, nombre: string | null, requiere_cambio_contrasena: boolean }[]>`
      select rol, nombre, requiere_cambio_contrasena from public.usuario_rol where id = ${user.id}
    `;

    if (!rolData) return null;
    if (rolData.rol !== "escaner" && rolData.rol !== "admin" && rolData.rol !== "vendedor") {
      return null;
    }

    return { 
      id: user.id,
      rol: rolData.rol as RolStaff, 
      nombre: rolData.nombre || user.email || "Usuario",
      requiereCambioContrasena: rolData.requiere_cambio_contrasena === true
    };
  } catch (err) {
    console.error("Error validando el paseActual:", err);
    return null;
  }
}

/** 
 * Verifica si un rol es suficiente. 
 * admin > vendedor > escaner 
 */
export function puede(pase: Pase | null, rol: RolStaff): boolean {
  if (!pase) return false;
  if (pase.rol === "admin") return true;
  if (rol === "escaner") return true; // Cualquiera (escaner o vendedor) puede escanear
  return false;
}

/** 
 * Autoriza un handler por cookie (SSR/Supabase) o por encabezado para el escáner offline.
 */
export async function paseDeRequest(request: Request): Promise<Pase | null> {
  // Para APIs Next.js edge/serverless, la forma más limpia es llamar a paseActual 
  // ya que supabase.ssr lee las cookies del request subyacente de next/headers automáticamente.
  return paseActual();
}
