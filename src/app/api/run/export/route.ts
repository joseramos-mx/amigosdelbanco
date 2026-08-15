import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerEvento } from "@/lib/run/inscripciones";
import { paseDeRequest, puede } from "@/lib/run/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exportaciones para proveedores y operación.
 *
 * Las columnas van en español porque las lee gente, no un sistema: el
 * cronometrista, la señora de las playeras y servicios médicos abren esto en
 * Excel y tienen que entenderlo sin traducir.
 */

type Tipo = "cronometraje" | "tallas" | "emergencias" | "seguro" | "no-activados" | "pendientes";

const CONSULTAS: Record<Tipo, (eventoId: string) => Promise<Record<string, unknown>[]>> = {
  // Padrón para el cronometrista. Sin dorsal no sirve, así que solo van los
  // que ya lo tienen.
  cronometraje: (id) => db()`
    select b.dorsal as "Dorsal", b.nombre as "Nombre", b.apellidos as "Apellidos",
           b.sexo::text as "Sexo", b.categoria as "Categoria",
           tb.nombre as "Tipo de boleto", coalesce(b.club, '') as "Club"
      from public.boleto b
      join public.tipo_boleto tb on tb.id = b.tipo_boleto_id
     where b.evento_id = ${id} and b.dorsal is not null
     order by b.dorsal
  `,

  tallas: (id) => db()`
    select tb.nombre as "Tipo de boleto", coalesce(b.talla_playera, 'sin definir') as "Talla",
           count(*)::int as "Cantidad"
      from public.boleto b
      join public.tipo_boleto tb on tb.id = b.tipo_boleto_id
     where b.evento_id = ${id} and b.activado_en is not null
     group by tb.nombre, b.talla_playera
     order by tb.nombre, b.talla_playera
  `,

  emergencias: (id) => db()`
    select coalesce(b.dorsal::text, '') as "Dorsal",
           concat_ws(' ', b.nombre, b.apellidos) as "Corredor",
           coalesce(b.contacto_emerg_nombre, '') as "Contacto",
           coalesce(b.contacto_emerg_tel, '') as "Telefono",
           coalesce(b.tipo_sangre, '') as "Tipo de sangre",
           coalesce(b.condiciones_medicas, '') as "Condiciones"
      from public.boleto b
     where b.evento_id = ${id} and b.activado_en is not null
     order by b.dorsal nulls last, b.apellidos
  `,

  seguro: (id) => db()`
    select concat_ws(' ', b.nombre, b.apellidos) as "Nombre completo",
           to_char(b.fecha_nacimiento, 'DD/MM/YYYY') as "Fecha de nacimiento",
           coalesce(b.dorsal::text, '') as "Dorsal"
      from public.boleto b
     where b.evento_id = ${id} and b.activado_en is not null
     order by b.apellidos, b.nombre
  `,

  // La lista que más trabajo ahorra: pagaron y nunca llenaron sus datos. Hay
  // que perseguirlos antes del corte del cronometrista.
  "no-activados": (id) => db()`
    select o.folio as "Folio", o.correo_comprador as "Correo de compra",
           o.nombre_comprador as "Quien compro",
           coalesce(o.telefono, '') as "Telefono",
           to_char(o.creada_en, 'DD/MM/YYYY') as "Fecha de compra"
      from public.boleto b
      join public.orden o on o.id = b.orden_id
     where b.evento_id = ${id}
       and b.activado_en is null
       and b.estado in ('pagado','dorsal_asignado')
     order by o.creada_en
  `,

  pendientes: (id) => db()`
    select o.folio as "Folio", o.correo_comprador as "Correo",
           o.nombre_comprador as "Nombre",
           ((o.monto_inscripcion + o.monto_donativo) / 100.0)::numeric(10,2) as "Total",
           to_char(o.expira_en, 'DD/MM/YYYY HH24:MI') as "Vence",
           coalesce((select p.referencia_externa from public.pago p
                      where p.orden_id = o.id and p.referencia_externa is not null
                      order by p.creado_en desc limit 1), '') as "Referencia"
      from public.orden o
     where o.evento_id = ${id}
       and o.estado = 'pendiente' and o.expira_en > now()
     order by o.expira_en
  `,
};

/**
 * CSV con marca de orden de bytes: sin ella, Excel en Windows abre el archivo
 * en la codificación del sistema y destroza todos los acentos.
 *
 * Se construye con fromCharCode y no con el carácter literal a propósito: el
 * U+FEFF es invisible en el código y se pierde en cuanto el archivo pasa por
 * una herramienta que normaliza la codificación.
 */
const BOM = String.fromCharCode(0xfeff);

function aCsv(filas: Record<string, unknown>[]): string {
  if (!filas.length) return `${BOM}(sin datos)\n`;
  const columnas = Object.keys(filas[0]);
  const escapar = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return (
    BOM +
    [columnas.join(","), ...filas.map((f) => columnas.map((c) => escapar(f[c])).join(","))].join("\n") +
    "\n"
  );
}

export async function GET(request: Request) {
  const pase = await paseDeRequest(request);
  if (!puede(pase, "admin")) {
    return NextResponse.json({ error: "Necesitas un pase de coordinación" }, { status: 401 });
  }

  const tipo = new URL(request.url).searchParams.get("tipo") as Tipo | null;
  if (!tipo || !(tipo in CONSULTAS)) {
    return NextResponse.json(
      { error: `Tipo inválido. Opciones: ${Object.keys(CONSULTAS).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const evento = await obtenerEvento();
    if (!evento) return NextResponse.json({ error: "Evento no configurado" }, { status: 503 });

    const filas = await CONSULTAS[tipo](evento.id);
    const fecha = new Date().toISOString().slice(0, 10);

    return new NextResponse(aCsv(filas), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tipo}-${fecha}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[run/export]", err);
    return NextResponse.json({ error: "No pudimos generar el archivo" }, { status: 500 });
  }
}
