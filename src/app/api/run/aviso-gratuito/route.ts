import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paseDeRequest, puede } from "@/lib/run/staff";
import { enviarAvisoEventoGratuito } from "@/lib/run/correos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Fila = {
    orden_id: string;
    folio: string;
    correo_comprador: string;
    nombre_comprador: string;
    total_centavos: string | number;
};

/** Se reembolsa inscripción + addons. El donativo NO se devuelve. */

export async function GET(request: Request) {
    try {
        const pase = await paseDeRequest(request);
        if (!puede(pase, "admin")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const rows = await db() <Fila[]>`
      select o.id as orden_id,
             o.folio,
             o.correo_comprador,
             o.nombre_comprador,
             (o.monto_inscripcion + o.monto_addons) as total_centavos
        from public.orden o
       where o.estado = 'pagada'
         and o.aviso_gratuito_en is null
         and o.motivo_cortesia is null
         and o.vendedor_id is null
         and o.correo_comprador is not null
         and o.correo_comprador not like '%@bancodurango.org'
       order by o.folio desc
    `;

        return NextResponse.json({
            pendientes: rows.map((r) => ({ ...r, total_centavos: Number(r.total_centavos) })),
        });
    } catch (e) {
        console.error("[aviso-gratuito][GET]", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Error interno" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const pase = await paseDeRequest(request);
        if (!puede(pase, "admin")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const ordenIds: string[] = Array.isArray(body.ordenIds) ? body.ordenIds : [];

        if (ordenIds.length === 0) {
            return NextResponse.json({ error: "Ninguna orden seleccionada" }, { status: 400 });
        }

        // Se vuelve a consultar con los filtros: no se confía en lo que manda el cliente.
        const rows = await db() <Fila[]>`
      select o.id as orden_id,
             o.folio,
             o.correo_comprador,
             o.nombre_comprador,
             (o.monto_inscripcion + o.monto_addons) as total_centavos
        from public.orden o
       where o.estado = 'pagada'
         and o.aviso_gratuito_en is null
         and o.motivo_cortesia is null
         and o.vendedor_id is null
         and o.correo_comprador is not null
         and o.correo_comprador not like '%@bancodurango.org'
         and o.id = any(${ordenIds})
       order by o.folio desc
    `;

        let enviados = 0;
        let fallidos = 0;

        for (const orden of rows) {
            try {
                const res = await enviarAvisoEventoGratuito({
                    correo: orden.correo_comprador,
                    folio: orden.folio,
                    totalCentavos: Number(orden.total_centavos),
                });

                if (res.ok) {
                    enviados++;
                    // Solo se marca si el correo salió; el "is null" evita doble marca.
                    await db()`
            update public.orden
               set aviso_gratuito_en = now()
             where id = ${orden.orden_id}
               and aviso_gratuito_en is null
          `;
                } else {
                    fallidos++;
                    console.error(`Error enviando a ${orden.folio}:`, res.error);
                }
            } catch (err) {
                fallidos++;
                console.error(`Excepción enviando a ${orden.folio}:`, err);
            }

            await new Promise((ok) => setTimeout(ok, 600)); // límite de Resend (~2/s)
        }

        return NextResponse.json({ enviados, fallidos, total: rows.length });
    } catch (e) {
        console.error("[aviso-gratuito][POST]", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Error interno" },
            { status: 500 },
        );
    }
}