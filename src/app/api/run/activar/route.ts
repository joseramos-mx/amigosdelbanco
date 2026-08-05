import { NextResponse } from "next/server";
import {
  BoletoNoPagado,
  TokenInvalido,
  activarBoleto,
  boletoCompleto,
  type DatosCorredor,
} from "@/lib/run/activacion";
import { enviarBoleto } from "@/lib/run/correos";

export const runtime = "nodejs";

const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];
const SEXOS = ["F", "M", "X"];

function texto(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function validar(
  body: unknown,
): { ok: true; token: string; datos: DatosCorredor } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Cuerpo inválido" };
  const b = body as Record<string, unknown>;

  const token = texto(b.token, 400);
  if (!token) return { ok: false, error: "Falta la liga de activación" };

  const nombre = texto(b.nombre);
  const apellidos = texto(b.apellidos);
  if (nombre.length < 2 || apellidos.length < 2) {
    return { ok: false, error: "Escribe nombre y apellidos" };
  }

  const fechaNacimiento = texto(b.fechaNacimiento, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    return { ok: false, error: "Fecha de nacimiento inválida" };
  }
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime()) || nacimiento > new Date()) {
    return { ok: false, error: "Fecha de nacimiento inválida" };
  }

  const sexo = texto(b.sexo, 1).toUpperCase();
  if (!SEXOS.includes(sexo)) return { ok: false, error: "Selecciona una opción de sexo" };

  const correo = texto(b.correo, 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, error: "Correo inválido" };
  }

  const tallaPlayera = texto(b.tallaPlayera, 4).toUpperCase();
  if (!TALLAS.includes(tallaPlayera)) return { ok: false, error: "Selecciona una talla" };

  const contactoEmergNombre = texto(b.contactoEmergNombre);
  const contactoEmergTel = texto(b.contactoEmergTel, 20);
  if (contactoEmergNombre.length < 3 || contactoEmergTel.length < 7) {
    return { ok: false, error: "Falta el contacto de emergencia" };
  }

  // La responsiva no es una casilla decorativa: sin ella no hay activación.
  if (b.aceptaResponsiva !== true) {
    return { ok: false, error: "Hay que aceptar la carta responsiva" };
  }

  return {
    ok: true,
    token,
    datos: {
      nombre,
      apellidos,
      fechaNacimiento,
      sexo: sexo as "F" | "M" | "X",
      correo,
      telefono: texto(b.telefono, 20) || undefined,
      tallaPlayera,
      club: texto(b.club, 80) || undefined,
      nacionalidad: texto(b.nacionalidad, 60) || undefined,
      contactoEmergNombre,
      contactoEmergTel,
      tipoSangre: texto(b.tipoSangre, 8) || undefined,
      condicionesMedicas: texto(b.condicionesMedicas, 500) || undefined,
    },
  };
}

/** IP de quien acepta, para el respaldo de la responsiva. */
function ipDe(request: Request): string | null {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  const resultado = validar(await request.json().catch(() => null));
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 400 });

  try {
    const { boletoId } = await activarBoleto(
      resultado.token,
      resultado.datos,
      ipDe(request),
    );

    const boleto = await boletoCompleto(boletoId);
    // El correo con el boleto es un extra: si Resend falla, la activación ya
    // quedó guardada y la persona puede descargar el PDF desde la pantalla.
    if (boleto) {
      enviarBoleto({ correo: resultado.datos.correo, boleto, token: resultado.token }).catch(
        (err) => console.error("[run/activar] no se pudo enviar el boleto:", err),
      );
    }

    return NextResponse.json({ ok: true, boletoId });
  } catch (err) {
    if (err instanceof TokenInvalido) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof BoletoNoPagado) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[run/activar]", err);
    return NextResponse.json(
      { error: "No pudimos guardar tus datos. Intenta de nuevo en un momento." },
      { status: 500 },
    );
  }
}
