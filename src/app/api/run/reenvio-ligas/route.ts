import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paseDeRequest, puede } from "@/lib/run/staff";
import { enviarLigasActivacion } from "@/lib/run/correos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const pase = await paseDeRequest(request);
  if (!puede(pase, "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await db()<
    {
      orden_id: string;
      folio: string;
      correo_comprador: string;
      nombre_comprador: string;
      tokens: string[];
    }[]
  >`
    select o.id as orden_id,
           o.folio,
           o.correo_comprador,
           o.nombre_comprador,
           array_agg(b.token_activacion) as tokens
      from public.orden o
      join public.boleto b on b.orden_id = o.id
     where (o.estado = 'pagada' or b.estado = 'pagado')
       and b.activado_en is null
       and o.correo_comprador is not null
     group by o.id, o.folio, o.correo_comprador, o.nombre_comprador
     order by o.folio desc
  `;

  return NextResponse.json({ pendientes: rows });
}

export async function POST(request: Request) {
  const pase = await paseDeRequest(request);
  if (!puede(pase, "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ordenIds: string[] = Array.isArray(body.ordenIds) ? body.ordenIds : [];

  if (ordenIds.length === 0) {
    return NextResponse.json({ error: "Ninguna orden seleccionada" }, { status: 400 });
  }

  const rows = await db()<
    {
      orden_id: string;
      folio: string;
      correo_comprador: string;
      nombre_comprador: string;
      tokens: string[];
    }[]
  >`
    select o.id as orden_id,
           o.folio,
           o.correo_comprador,
           o.nombre_comprador,
           array_agg(b.token_activacion) as tokens
      from public.orden o
      join public.boleto b on b.orden_id = o.id
     where (o.estado = 'pagada' or b.estado = 'pagado')
       and b.activado_en is null
       and o.correo_comprador is not null
       and o.id = any(${ordenIds})
     group by o.id, o.folio, o.correo_comprador, o.nombre_comprador
  `;

  let enviados = 0;
  let fallidos = 0;

  for (const orden of rows) {
    if (!orden.correo_comprador || !orden.tokens || orden.tokens.length === 0) continue;
    try {
      const res = await enviarLigasActivacion({
        correo: orden.correo_comprador,
        folio: orden.folio,
        tokens: orden.tokens,
      });
      if (res.ok) {
        enviados++;
      } else {
        fallidos++;
        console.error(`Error enviando a ${orden.folio}:`, res.error);
      }
    } catch (err) {
      fallidos++;
      console.error(`Excepción enviando a ${orden.folio}:`, err);
    }
  }

  return NextResponse.json({ enviados, fallidos, total: rows.length });
}
