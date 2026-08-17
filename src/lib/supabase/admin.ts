import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key. Salta RLS por completo, así que
 * SOLO se usa en código de servidor (rutas /api), nunca se importa
 * en un componente "use client" ni se expone al navegador.
 *
 * Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (la
 * "service_role" key de Supabase, no la anon/public). Consíguela en
 * Project Settings → API, y agrégala solo en el servidor (Vercel env
 * vars, .env.local, etc.) — nunca con prefijo NEXT_PUBLIC_.
 */
export function createClienteAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno"
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}