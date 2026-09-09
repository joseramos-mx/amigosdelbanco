import { NextResponse } from "next/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { paseActual } from "@/lib/run/staff";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";
import { validarSinTraslapesInternos, type RangoFolio } from "@/lib/run/folios";

export const dynamic = "force-dynamic";

const ERROR_GENERICO = "No se pudo completar la operación. Intenta de nuevo.";

type Params = { params: Promise<{ id: string }> };

function agruparFoliosVendidos(numeros: number[]): { desde: number; hasta: number | null }[] {
    const ordenados = Array.from(new Set(numeros)).sort((a, b) => a - b);
    const grupos: { desde: number; hasta: number | null }[] = [];

    let desde: number | null = null;
    let anterior: number | null = null;

    for (const n of ordenados) {
        if (desde === null) {
            desde = n;
            anterior = n;
            continue;
        }
        if (n === (anterior as number) + 1) {
            anterior = n;
            continue;
        }
        grupos.push({ desde, hasta: desde === anterior ? null : anterior });
        desde = n;
        anterior = n;
    }

    if (desde !== null) {
        grupos.push({ desde, hasta: desde === anterior ? null : anterior });
    }

    return grupos;
}

// Da formato "GG-NNNNN" (5 dígitos con ceros a la izquierda) a un número de folio.
function formatearFolio(num: number): string {
    return `GG-${String(num).padStart(5, "0")}`;
}

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
        .select("id, rol, nombre, activo, deleted_at")
        .eq("id", staffId)
        .single();

    if (errorExistente || !existente) {
        return NextResponse.json({ error: "No se encontró ese usuario" }, { status: 404 });
    }

    if (!existente.activo || existente.deleted_at) {
        return NextResponse.json(
            { error: "Este usuario está desactivado y no se puede actualizar" },
            { status: 409 }
        );
    }

    const esVendedor = existente.rol === "vendedor";

    let rangos: RangoFolio[] = [];
    let eventoId: string | null = null;

    if (esVendedor) {
        rangos = Array.isArray(body.rangos) ? body.rangos : [];
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

        eventoId = evento.id;
    }

    const revertirNombre = async () => {
        const { error: errorRevertir } = await admin
            .from("usuario_rol")
            .update({ nombre: existente.nombre })
            .eq("id", staffId);
        if (errorRevertir) {
            console.error("[api/run/staff/:id] ROLLBACK nombre falló:", errorRevertir);
        }
        const { error: errorRevertirAuth } = await admin.auth.admin.updateUserById(staffId, {
            user_metadata: { nombre: existente.nombre },
        });
        if (errorRevertirAuth) {
            console.error("[api/run/staff/:id] ROLLBACK metadata de Auth falló:", errorRevertirAuth);
        }
    };

    const { error: errorNombre } = await admin
        .from("usuario_rol")
        .update({ nombre })
        .eq("id", staffId);

    if (errorNombre) {
        console.error("[api/run/staff/:id] actualizar nombre:", errorNombre);
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    const { error: errorMetadata } = await admin.auth.admin.updateUserById(staffId, {
        user_metadata: { nombre },
    });

    if (errorMetadata) {
        console.error("[api/run/staff/:id] actualizar metadata de Auth:", errorMetadata);
        await revertirNombre();
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    if (!esVendedor) {
        return NextResponse.json({ ok: true });
    }

    const { error: errorAsignar } = await admin.rpc("asignar_rangos_vendedor", {
        p_vendedor_id: staffId,
        p_evento_id: eventoId,
        p_rangos: rangos.map((r) => ({
            folio_desde: r.folioDesde,
            folio_hasta: r.folioHasta,
        })),
    });

    if (errorAsignar) {
        console.error("[api/run/staff/:id] asignar_rangos_vendedor:", errorAsignar);
        await revertirNombre();

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
            { error: "No puedes desactivar tu propia cuenta desde aquí" },
            { status: 400 }
        );
    }

    const admin = createClienteAdmin();

    const { data: existente, error: errorExistente } = await admin
        .from("usuario_rol")
        .select("id, rol, activo, deleted_at")
        .eq("id", staffId)
        .single();

    if (errorExistente || !existente) {
        return NextResponse.json({ error: "No se encontró ese usuario" }, { status: 404 });
    }

    const esVendedor = existente.rol === "vendedor";

    let ordenesLiberadas: string[] = [];
    type RangoExistente = {
        id: string;
        vendedor_id: string;
        evento_id: string;
        folio_desde: string;
        folio_hasta: string | null;
        creado_en: string;
    };
    let rangosOriginales: RangoExistente[] = [];
    let rangosHistoricoIds: string[] = [];

    const revertirOrdenes = async () => {
        if (ordenesLiberadas.length === 0) return;
        const { error: errorRevertirOrdenes } = await admin
            .from("orden")
            .update({ vendedor_id: staffId })
            .in("id", ordenesLiberadas);
        if (errorRevertirOrdenes) {
            console.error("[api/run/staff/:id] ROLLBACK folios falló:", errorRevertirOrdenes);
        }
    };

    const revertirRangos = async () => {
        if (rangosHistoricoIds.length > 0) {
            const { error: errorBorrarHistorico } = await admin
                .from("vendedor_rango")
                .delete()
                .in("id", rangosHistoricoIds);
            if (errorBorrarHistorico) {
                console.error("[api/run/staff/:id] ROLLBACK borrar histórico falló:", errorBorrarHistorico);
            }
        }
        if (rangosOriginales.length > 0) {
            const { error: errorRevertirRangos } = await admin.from("vendedor_rango").insert(rangosOriginales);
            if (errorRevertirRangos) {
                console.error("[api/run/staff/:id] ROLLBACK reinsertar rango original falló:", errorRevertirRangos);
            }
        }
    };

    if (esVendedor) {
        const { data: evento, error: errorEvento } = await admin
            .from("evento")
            .select("id")
            .eq("slug", EVENTO_SLUG)
            .single();

        if (errorEvento || !evento) {
            console.error("[api/run/staff/:id] evento no encontrado:", errorEvento);
            return NextResponse.json({ error: "No se encontró el evento activo" }, { status: 500 });
        }

        const { data: rangosExistentes, error: errorConsultarRangos } = await admin
            .from("vendedor_rango")
            .select("id, vendedor_id, evento_id, folio_desde, folio_hasta, creado_en")
            .eq("vendedor_id", staffId)
            .eq("evento_id", evento.id);

        if (errorConsultarRangos) {
            console.error("[api/run/staff/:id] consultar rangos de folios:", errorConsultarRangos);
            return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
        }

        rangosOriginales = rangosExistentes ?? [];

        if (rangosOriginales.length > 0) {
            const numerosVendidos: number[] = [];

            for (const rango of rangosOriginales) {
                const folioHastaConsulta = rango.folio_hasta ?? rango.folio_desde;
                const { data: vendidos, error: errorVendidos } = await admin
                    .from("orden")
                    .select("folio")
                    .eq("vendedor_id", staffId)
                    .eq("evento_id", evento.id)
                    .eq("estado", "pagada")
                    .gte("folio", rango.folio_desde)
                    .lte("folio", folioHastaConsulta);

                if (errorVendidos) {
                    console.error("[api/run/staff/:id] consultar folios vendidos:", errorVendidos);
                    return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
                }

                for (const o of (vendidos ?? []) as { folio: string }[]) {
                    numerosVendidos.push(Number(o.folio.slice(3)));
                }
            }

            const nuevosRangos = agruparFoliosVendidos(numerosVendidos).map((g) => ({
                vendedor_id: staffId,
                evento_id: evento.id,
                folio_desde: formatearFolio(g.desde),
                folio_hasta: g.hasta === null ? null : formatearFolio(g.hasta),
            }));

            const { error: errorEliminarRangos } = await admin
                .from("vendedor_rango")
                .delete()
                .in(
                    "id",
                    rangosOriginales.map((r) => r.id)
                );
            if (errorEliminarRangos) {
                console.error("[api/run/staff/:id] liberar rangos de folios:", errorEliminarRangos);
                return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
            }

            if (nuevosRangos.length > 0) {
                const { data: rangosInsertados, error: errorInsertarHistorico } = await admin
                    .from("vendedor_rango")
                    .insert(nuevosRangos)
                    .select("id");

                if (errorInsertarHistorico) {
                    console.error("[api/run/staff/:id] guardar histórico de venta:", errorInsertarHistorico);
                    await revertirRangos();
                    return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
                }

                rangosHistoricoIds = (rangosInsertados ?? []).map((r: { id: string }) => r.id);
            }
        }

        const { data: ordenesPendientes, error: errorConsultarOrdenes } = await admin
            .from("orden")
            .select("id")
            .eq("vendedor_id", staffId)
            .eq("evento_id", evento.id)
            .eq("estado", "pendiente");

        if (errorConsultarOrdenes) {
            console.error("[api/run/staff/:id] consultar folios pendientes:", errorConsultarOrdenes);
            await revertirRangos();
            return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
        }

        ordenesLiberadas = (ordenesPendientes ?? []).map((o: { id: string }) => o.id);

        if (ordenesLiberadas.length > 0) {
            const { error: errorSoltar } = await admin
                .from("orden")
                .update({ vendedor_id: null })
                .in("id", ordenesLiberadas);
            if (errorSoltar) {
                console.error("[api/run/staff/:id] liberar folios pendientes:", errorSoltar);
                await revertirRangos();
                return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
            }
        }
    }

    const { error: errorDesactivar } = await admin
        .from("usuario_rol")
        .update({ activo: false, deleted_at: new Date().toISOString() })
        .eq("id", staffId);
    if (errorDesactivar) {
        console.error("[api/run/staff/:id] marcar inactivo:", errorDesactivar);
        await revertirOrdenes();
        await revertirRangos();
        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    //ban de usuaio por 100 años
    const { error: errorBan } = await admin.auth.admin.updateUserById(staffId, {
        ban_duration: "876000h",
    });
    if (errorBan) {
        console.error("[api/run/staff/:id] banear en Auth:", errorBan);

        const { error: errorRevertirActivo } = await admin
            .from("usuario_rol")
            .update({ activo: existente.activo, deleted_at: existente.deleted_at })
            .eq("id", staffId);
        if (errorRevertirActivo) {
            console.error("[api/run/staff/:id] ROLLBACK activo/deleted_at falló:", errorRevertirActivo);
        }
        await revertirOrdenes();
        await revertirRangos();

        return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}