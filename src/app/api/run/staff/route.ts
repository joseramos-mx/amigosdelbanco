import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { paseActual } from "@/lib/run/staff";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";
import { enviarAccesoStaff } from "@/lib/run/correos";
import { validarSinTraslapesInternos, type RangoFolio } from "@/lib/run/folios";

export const dynamic = "force-dynamic";

const ROLES_VALIDOS = ["admin", "escaner", "vendedor"] as const;
type Rol = (typeof ROLES_VALIDOS)[number];

const ERROR_GENERICO = "No se pudo completar la operación. Intenta de nuevo.";

function generarContrasenaTemporal() {
    const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = randomBytes(14);
    let out = "";
    for (let i = 0; i < 14; i++) out += alfabeto[bytes[i] % alfabeto.length];
    return out;
}

export async function POST(req: Request) {
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

    let rangos: RangoFolio[] = [];
    if (rol === "vendedor") {
        rangos = Array.isArray(body.rangos) ? body.rangos : [];
        if (rangos.length === 0) {
            return NextResponse.json(
                { error: "Agrega al menos un rango de folios para este vendedor" },
                { status: 400 }
            );
        }
        const errorRangos = validarSinTraslapesInternos(rangos);
        if (errorRangos) {
            return NextResponse.json({ error: errorRangos }, { status: 400 });
        }
    }

    const admin = createClienteAdmin();

    const contrasenaTemporal = generarContrasenaTemporal();
    const { data: usuarioCreado, error: errorAuth } = await admin.auth.admin.createUser({
        email: correo,
        password: contrasenaTemporal,
        email_confirm: true,
        user_metadata: { nombre, requiere_cambio_contrasena: true },
    });

    if (errorAuth || !usuarioCreado?.user) {
        const yaExiste = errorAuth?.message?.toLowerCase().includes("already been registered");
        return NextResponse.json(
            { error: yaExiste ? "Ese correo ya tiene una cuenta" : "No se pudo crear el usuario" },
            { status: 400 }
        );
    }

    const userId = usuarioCreado.user.id;

    async function deshacer() {
        await admin.from("usuario_rol").delete().eq("id", userId);
        await admin.auth.admin.deleteUser(userId);
    }

    try {
        const { error: errorRol } = await admin.from("usuario_rol").insert({
            id: userId,
            rol,
            nombre,
            correo,
            requiere_cambio_contrasena: true,
        });

        if (errorRol) {
            console.error("[api/run/staff] insertar usuario_rol:", errorRol);
            throw new Error(ERROR_GENERICO);
        }

        if (rol === "vendedor") {
            const { data: evento, error: errorEvento } = await admin
                .from("evento")
                .select("id")
                .eq("slug", EVENTO_SLUG)
                .single();

            if (errorEvento || !evento) {
                console.error("[api/run/staff] evento no encontrado:", errorEvento);
                throw new Error("No se encontró el evento activo");
            }

            for (const r of rangos) {
                const { count: yaAsignados, error: errorConteo } = await admin
                    .from("orden")
                    .select("id", { count: "exact", head: true })
                    .eq("evento_id", evento.id)
                    .gte("folio", r.folioDesde)
                    .lte("folio", r.folioHasta)
                    .not("vendedor_id", "is", null);

                if (errorConteo) {
                    console.error("[api/run/staff] contar folios asignados:", errorConteo);
                    throw new Error(ERROR_GENERICO);
                }

                if (yaAsignados && yaAsignados > 0) {
                    // Error de negocio (409), con mensaje ya seguro de mostrar tal cual.
                    await deshacer();
                    return NextResponse.json(
                        {
                            error: `El rango ${r.folioDesde}–${r.folioHasta} choca con folios que ya tiene otro vendedor. Elige otro rango.`,
                        },
                        { status: 409 }
                    );
                }

                const { error: errorUpdate } = await admin
                    .from("orden")
                    .update({ vendedor_id: userId })
                    .eq("evento_id", evento.id)
                    .gte("folio", r.folioDesde)
                    .lte("folio", r.folioHasta);

                if (errorUpdate) {
                    console.error("[api/run/staff] asignar vendedor_id:", errorUpdate);
                    throw new Error(ERROR_GENERICO);
                }

                const { error: errorInsertRango } = await admin.from("vendedor_rango").insert({
                    vendedor_id: userId,
                    evento_id: evento.id,
                    folio_desde: r.folioDesde,
                    folio_hasta: r.folioHasta,
                });

                if (errorInsertRango) {
                    console.error("[api/run/staff] insertar vendedor_rango:", errorInsertRango);
                    throw new Error(ERROR_GENERICO);
                }
            }
        }

        // El usuario ya quedó creado y funcional aunque el correo falle, así
        // que esto no forma parte del rollback: si Resend no responde, el
        // registro sigue siendo válido y solo avisamos que hay que repartir
        // la contraseña a mano.
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
            correoEnviado,
            ...(rol === "vendedor" ? { rangos } : {}),
        });
    } catch (err) {
        await deshacer();
        const mensaje = err instanceof Error ? err.message : ERROR_GENERICO;
        return NextResponse.json({ error: mensaje }, { status: 500 });
    }
}

export async function GET() {
    const pase = await paseActual();
    if (!pase || pase.rol !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const admin = createClienteAdmin();

    const { data: staff, error: errorStaff } = await admin
        .from("usuario_rol")
        .select("id, nombre, correo, rol, creado_en")
        .order("creado_en", { ascending: false });

    if (errorStaff) {
        console.error("[api/run/staff] listar usuario_rol:", errorStaff);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    const { data: rangos, error: errorRangos } = await admin
        .from("vendedor_rango")
        .select("id, vendedor_id, folio_desde, folio_hasta")
        .order("folio_desde", { ascending: true });

    if (errorRangos) {
        console.error("[api/run/staff] listar vendedor_rango:", errorRangos);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    const listaConRangos = (staff ?? []).map((s) => ({
        id: s.id,
        nombre: s.nombre,
        correo: s.correo,
        rol: s.rol as Rol,
        rangos: (rangos ?? [])
            .filter((r) => r.vendedor_id === s.id)
            .map((r) => ({ id: r.id, folioDesde: r.folio_desde, folioHasta: r.folio_hasta })),
    }));

    return NextResponse.json({ staff: listaConRangos });
}