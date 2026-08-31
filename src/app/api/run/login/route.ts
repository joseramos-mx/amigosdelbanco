import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

declare global {
  var limitadorLogin: Map<string, { intentos: number; reseteo: number }> | undefined;
}

// Mapa en memoria para guardar los intentos por IP (sobrevive al HMR en dev)
const limitador = global.limitadorLogin || new Map<string, { intentos: number; reseteo: number }>();
if (process.env.NODE_ENV !== "production") {
  global.limitadorLogin = limitador;
}

function checarLimite(ip: string): boolean {
  const ahora = Date.now();
  const ventana = 15 * 60 * 1000; // 15 minutos
  const maximos = 5; // 5 intentos permitidos

  let data = limitador.get(ip);
  if (!data || ahora > data.reseteo) {
    data = { intentos: 0, reseteo: ahora + ventana };
  }

  data.intentos++;
  limitador.set(ip, data);

  // Limpieza ocasional de la memoria para IPs viejas
  if (Math.random() < 0.1) {
    for (const [k, v] of limitador.entries()) {
      if (ahora > v.reseteo) limitador.delete(k);
    }
  }

  return data.intentos <= maximos;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "ip-desconocida";
               
    if (!checarLimite(ip)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." }, 
        { status: 429 }
      );
    }

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

    // Si el login fue exitoso, limpiamos sus intentos fallidos
    limitador.delete(ip);

    return NextResponse.json({ ok: true, rol: rolData.rol });
  } catch (err) {
    console.error("Error en login:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
