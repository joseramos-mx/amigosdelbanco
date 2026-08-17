import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { paseActual } from "@/lib/run/staff";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";
import { enviarAccesoStaff } from "@/lib/run/correos";

export const dynamic = "force-dynamic";

const ROLES_VALIDOS = ["admin", "escaner", "vendedor"] as const;
type Rol = (typeof ROLES_VALIDOS)[number];

const FOLIO_REGEX = /^GG-\d{5}$/;

function generarContrasenaTemporal() {
    const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = randomBytes(14);
    let out = "";
    for (let i = 0; i < 14; i++) out += alfabeto[bytes[i] % alfabeto.length];
    return out;
}

export async function POST(req: Request) {
    // Solo un admin autenticado puede dar de alta staff.
    const pase = await paseActual();
    if (!pase || pase.rol !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const nombre = String(body.nombre ?? "").trim();
    const correo = String(body.correo ?? "").trim().toLowerCase();
    const rol = String(body.rol ?? "") as Rol;

    if (!nombre) {
        return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }
    if (!correo || !correo.includes("@")) {
        return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    let folioDesde: string | null = null;
    let folioHasta: string | null = null;

    if (rol === "vendedor") {
        folioDesde = String(body.folioDesde ?? "");
        folioHasta = String(body.folioHasta ?? "");
        if (!FOLIO_REGEX.test(folioDesde) || !FOLIO_REGEX.test(folioHasta)) {
            return NextResponse.json(
                { error: "Rango de folios inválido, debe verse como GG-00001" },
                { status: 400 }
            );
        }
        if (folioDesde > folioHasta) {
            return NextResponse.json(
                { error: "El folio inicial no puede ser mayor que el final" },
                { status: 400 }
            );
        }
    }

    const admin = createClienteAdmin();

    // 1. Crear el usuario en Supabase Auth con contraseña temporal.
    // Queda marcado con requiere_cambio_contrasena en sus metadatos para
    // que el login lo pueda forzar a cambiarla antes de dejarlo pasar.
    const contrasenaTemporal = generarContrasenaTemporal();
    const { data: usuarioCreado, error: errorAuth } =
        await admin.auth.admin.createUser({
            email: correo,
            password: contrasenaTemporal,
            email_confirm: true,
            user_metadata: { nombre, requiere_cambio_contrasena: true },
        });

    if (errorAuth || !usuarioCreado?.user) {
        const yaExiste = errorAuth?.message
            ?.toLowerCase()
            .includes("already been registered");
        return NextResponse.json(
            { error: yaExiste ? "Ese correo ya tiene una cuenta" : "No se pudo crear el usuario" },
            { status: 400 }
        );
    }

    const userId = usuarioCreado.user.id;

    // A partir de aquí ya existe el usuario de Auth. Si cualquier paso
    // siguiente falla (incluyendo una excepción inesperada), lo deshacemos
    // por completo: nunca debe quedar un usuario huérfano sin fila en
    // usuario_rol, ni un vendedor a medio asignar.
    async function deshacer() {
        await admin.from("usuario_rol").delete().eq("id", userId);
        await admin.auth.admin.deleteUser(userId);
    }

    try {
        // 2. Registrar su rol.
        const { error: errorRol } = await admin.from("usuario_rol").insert({
            id: userId,
            rol,
            nombre,
            requiere_cambio_contrasena: true,
        });

        if (errorRol) {
            throw new Error("No se pudo asignar el rol");
        }

        let foliosAsignados = 0;

        // 3. Si es vendedor, asignarle el rango de folios en la tabla de órdenes.
        if (rol === "vendedor" && folioDesde && folioHasta) {
            const { data: evento, error: errorEvento } = await admin
                .from("evento")
                .select("id")
                .eq("slug", EVENTO_SLUG)
                .single();

            if (errorEvento || !evento) {
                throw new Error("No se encontró el evento activo");
            }

            // No pisar folios que ya traen otro vendedor asignado.
            const { count: yaAsignados, error: errorConteo } = await admin
                .from("orden")
                .select("id", { count: "exact", head: true })
                .eq("evento_id", evento.id)
                .gte("folio", folioDesde)
                .lte("folio", folioHasta)
                .not("vendedor_id", "is", null);

            if (errorConteo) {
                throw new Error("No se pudo validar el rango");
            }

            if (yaAsignados && yaAsignados > 0) {
                // Este caso no es un error inesperado sino de validación de
                // negocio (409), así que lo deshacemos y respondemos aquí
                // mismo en vez de dejar que el catch genérico regrese 500.
                await deshacer();
                return NextResponse.json(
                    {
                        error: `${yaAsignados} folio(s) en ese rango ya tienen vendedor asignado. Elige otro rango.`,
                    },
                    { status: 409 }
                );
            }

            const { data: actualizados, error: errorUpdate } = await admin
                .from("orden")
                .update({ vendedor_id: userId })
                .eq("evento_id", evento.id)
                .gte("folio", folioDesde)
                .lte("folio", folioHasta)
                .select("id");

            if (errorUpdate) {
                throw new Error(
                    "No se pudo asignar el rango de folios"
                );
            }

            foliosAsignados = actualizados?.length ?? 0;
        }
        //si el correo falla aún se crea el usuario
        const { ok: correoEnviado } = await enviarAccesoStaff({
            correo,
            nombre,
            rol,
            contrasenaTemporal,
        });

        return NextResponse.json({
            correo,
            rol,
            contrasenaTemporal,
            requiereCambioContrasena: true,
            correoEnviado,
            ...(rol === "vendedor" ? { folioDesde, folioHasta, foliosAsignados } : {}),
        });
    } catch (err) {
        // Rollback total: borra la fila de usuario_rol (si llegó a
        // insertarse) y el usuario de Auth, sin importar en qué paso falló.
        await deshacer();
        const mensaje = "No se pudo completar el registro";
        return NextResponse.json({ error: mensaje }, { status: 500 });
    }
}