import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { correo, contrasena } = await request.json();

    if (!correo || !contrasena) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (error || !data.user) {
      console.error("Supabase Auth Error:", error?.message || "No user data");
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    // Buscar rol
    const sql = db();
    const [rolData] = await sql<{ rol: string }[]>`
      select rol from public.usuario_rol where id = ${data.user.id}
    `;

    if (!rolData) {
      return NextResponse.json({ error: "Usuario sin rol asignado" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, rol: rolData.rol });
  } catch (err) {
    console.error("Error en login:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
