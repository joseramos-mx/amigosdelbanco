import { NextResponse } from "next/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { paseActual } from "@/lib/run/staff";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";
import { validarSinTraslapesInternos, type RangoFolio } from "@/lib/run/folios";

export const dynamic = "force-dynamic";

const ERROR_GENERICO = "No se pudo completar la operación. Intenta de nuevo.";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
    const pase = await paseActual();
    if (!pase || pase.rol !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: staffId } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const nombre = String(body.nombre ?? "").trim();
    if (!nombre) {
        return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }

    const admin = createClienteAdmin();

    const { data: existente, error: errorExistente } = await admin
        .from("usuario_rol")
        .select("id, rol")
        .eq("id", staffId)
        .single();

    if (errorExistente || !existente) {
        return NextResponse.json({ error: "No se encontró ese usuario" }, { status: 404 });
    }

    const { error: errorNombre } = await admin
        .from("usuario_rol")
        .update({ nombre })
        .eq("id", staffId);

    if (errorNombre) {
        console.error("[api/run/staff/:id] actualizar nombre:", errorNombre);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    await admin.auth.admin.updateUserById(staffId, { user_metadata: { nombre } });

    if (existente.rol !== "vendedor") {
        return NextResponse.json({ ok: true });
    }

    const rangos: RangoFolio[] = Array.isArray(body.rangos) ? body.rangos : [];
    if (rangos.length === 0) {
        return NextResponse.json(
            { error: "Este vendedor necesita al menos un rango de folios" },
            { status: 400 }
        );
    }

    const errorRangos = validarSinTraslapesInternos(rangos);
    if (errorRangos) {
        return NextResponse.json({ error: errorRangos }, { status: 400 });
    }

    const { data: evento, error: errorEvento } = await admin
        .from("evento")
        .select("id")
        .eq("slug", EVENTO_SLUG)
        .single();

    if (errorEvento || !evento) {
        console.error("[api/run/staff/:id] evento no encontrado:", errorEvento);
        return NextResponse.json({ error: "No se encontró el evento activo" }, { status: 500 });
    }

    const { error: errorAsignar } = await admin.rpc("asignar_rangos_vendedor", {
        p_vendedor_id: staffId,
        p_evento_id: evento.id,
        p_rangos: rangos.map((r) => ({
            folio_desde: r.folioDesde,
            folio_hasta: r.folioHasta,
        })),
    });

    if (errorAsignar) {
        console.error("[api/run/staff/:id] asignar_rangos_vendedor:", errorAsignar);

        if (errorAsignar.code === "23P01" || errorAsignar.code === "23505") {
            return NextResponse.json(
                {
                    error: "Ese rango choca con folios que ya tiene otro vendedor. No se guardó ningún cambio; ajusta el rango e intenta de nuevo.",
                },
                { status: 409 }
            );
        }
        if (errorAsignar.code === "22023") {
            return NextResponse.json({ error: errorAsignar.message }, { status: 400 });
        }

        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
    const pase = await paseActual();
    if (!pase || pase.rol !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: staffId } = await params;

    if (staffId === pase.id) {
        return NextResponse.json(
            { error: "No puedes eliminar tu propia cuenta desde aquí" },
            { status: 400 }
        );
    }

    const admin = createClienteAdmin();

    const { error: errorSoltar } = await admin
        .from("orden")
        .update({ vendedor_id: null })
        .eq("vendedor_id", staffId);
    if (errorSoltar) {
        console.error("[api/run/staff/:id] soltar folios al eliminar:", errorSoltar);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    await admin.from("vendedor_rango").delete().eq("vendedor_id", staffId);
    await admin.from("usuario_rol").delete().eq("id", staffId);

    const { error } = await admin.auth.admin.deleteUser(staffId);
    if (error) {
        console.error("[api/run/staff/:id] borrar de Auth:", error);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}