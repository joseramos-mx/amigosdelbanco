import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { paseActual } from "@/lib/run/staff";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";

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
    const contrasenaTemporal = generarContrasenaTemporal();
    const { data: usuarioCreado, error: errorAuth } =
        await admin.auth.admin.createUser({
            email: correo,
            password: contrasenaTemporal,
            email_confirm: true,
            user_metadata: { nombre },
        });

    if (errorAuth || !usuarioCreado?.user) {
        const yaExiste = errorAuth?.message
            ?.toLowerCase()
            .includes("already been registered");
        return NextResponse.json(
            { error: yaExiste ? "Ese correo ya tiene una cuenta" : errorAuth?.message ?? "No se pudo crear el usuario" },
            { status: 400 }
        );
    }

    const userId = usuarioCreado.user.id;

    async function deshacer() {
        await admin.from("usuario_rol").delete().eq("id", userId);
        await admin.auth.admin.deleteUser(userId);
    }

    const { error: errorRol } = await admin
        .from("usuario_rol")
        .insert({ id: userId, rol, nombre });

    if (errorRol) {
        await admin.auth.admin.deleteUser(userId);
        return NextResponse.json(
            { error: "No se pudo asignar el rol: " + errorRol.message },
            { status: 500 }
        );
    }

    let foliosAsignados = 0;

    if (rol === "vendedor" && folioDesde && folioHasta) {
        const { data: evento, error: errorEvento } = await admin
            .from("evento")
            .select("id")
            .eq("slug", EVENTO_SLUG)
            .single();

        if (errorEvento || !evento) {
            await deshacer();
            return NextResponse.json(
                { error: "No se encontró el evento activo" },
                { status: 500 }
            );
        }

        const { count: yaAsignados, error: errorConteo } = await admin
            .from("orden")
            .select("id", { count: "exact", head: true })
            .eq("evento_id", evento.id)
            .gte("folio", folioDesde)
            .lte("folio", folioHasta)
            .not("vendedor_id", "is", null);

        if (errorConteo) {
            await deshacer();
            return NextResponse.json(
                { error: "No se pudo validar el rango: " + errorConteo.message },
                { status: 500 }
            );
        }

        if (yaAsignados && yaAsignados > 0) {
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
            await deshacer();
            return NextResponse.json(
                { error: "No se pudo asignar el rango de folios: " + errorUpdate.message },
                { status: 500 }
            );
        }

        foliosAsignados = actualizados?.length ?? 0;
    }

    return NextResponse.json({
        correo,
        rol,
        contrasenaTemporal,
        ...(rol === "vendedor" ? { folioDesde, folioHasta, foliosAsignados } : {}),
    });
}