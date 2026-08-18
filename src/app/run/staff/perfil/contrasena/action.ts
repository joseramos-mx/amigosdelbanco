"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function cambiarContrasenaAction(prevState: any, formData: FormData) {
  const contrasena = formData.get("contrasena") as string;
  const confirmacion = formData.get("confirmacion") as string;

  if (!contrasena || !confirmacion) {
    return { error: "Ambos campos son requeridos." };
  }

  if (contrasena !== confirmacion) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Validaciones estrictas
  if (contrasena.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(contrasena)) {
    return { error: "La contraseña debe incluir al menos una mayúscula." };
  }
  if (!/[a-z]/.test(contrasena)) {
    return { error: "La contraseña debe incluir al menos una minúscula." };
  }
  if (!/[0-9]/.test(contrasena)) {
    return { error: "La contraseña debe incluir al menos un número." };
  }
  if (!/[^A-Za-z0-9]/.test(contrasena)) {
    return { error: "La contraseña debe incluir al menos un símbolo especial." };
  }

  const supabase = await createClient();
  
  // Actualizar la contraseña en auth
  const { data, error } = await supabase.auth.updateUser({
    password: contrasena,
  });

  if (error) {
    return { error: error.message };
  }

  // Quitar la bandera de la base de datos
  if (data?.user?.id) {
    const sql = db();
    await sql`update public.usuario_rol set requiere_cambio_contrasena = false where id = ${data.user.id}`;
  }

  return { success: true };
}
