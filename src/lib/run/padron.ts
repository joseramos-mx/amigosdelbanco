import "server-only";
import { conReintento, db, enTransaccion } from "@/lib/db";
import { crearTokenQr } from "./tokens";

/**
 * Consultas de operación: lo que ve el panel, lo que se exporta a proveedores
 * y lo que el escáner cachea antes de abrir.
 */

export type ResumenEvento = {
  evento: {
    id: string;
    nombre: string;
    estado: string;
    fecha_carrera: Date;
    sede: string;
  };
  cupoTotal: number;
  vendidos: number;
  disponibles: number;
  pagados: number;
  activados: number;
  sinActivar: number;
  pendientesDePago: number;
  entregados: number;
  recaudadoCentavos: number;
  donativosCentavos: number;
  vendidosDigitales: number;
  vendidosFisicos: number;
  cortesias: number;
};

export async function resumen(slug: string): Promise<ResumenEvento | null> {
  const filas = await conReintento(() => db()<
    {
      id: string; nombre: string; estado: string; fecha_carrera: Date; sede: string;
      cupo_total: number; vendidos: number; pagados: number; activados: number;
      sin_activar: number; pendientes_pago: number; entregados: number;
      recaudado: number; donativos: number; vendidos_digitales: number;
      vendidos_fisicos: number; cortesias_count: number;
    }[]
  >`
    select e.id, e.nombre, e.estado::text as estado, e.fecha_carrera, e.sede,
           coalesce(sum(tb.cupo_total), 0)::int as cupo_total,

           (select count(*) from public.boleto b
              join public.orden o on o.id = b.orden_id
             where b.evento_id = e.id
               and (o.estado = 'pagada'
                    or (o.estado = 'pendiente' and o.expira_en > now())))::int as vendidos,

           (select count(*) from public.boleto b
              join public.orden o on o.id = b.orden_id
             where b.evento_id = e.id
               and (o.estado = 'pagada' or (o.estado = 'pendiente' and o.expira_en > now()))
               and coalesce(b.boleto_fisico, false) = false
               and o.motivo_cortesia is null)::int as vendidos_digitales,

           (select count(*) from public.boleto b
              join public.orden o on o.id = b.orden_id
             where b.evento_id = e.id
               and (o.estado = 'pagada' or (o.estado = 'pendiente' and o.expira_en > now()))
               and b.boleto_fisico = true)::int as vendidos_fisicos,

           (select count(*) from public.boleto b
              join public.orden o on o.id = b.orden_id
             where b.evento_id = e.id
               and (o.estado = 'pagada' or (o.estado = 'pendiente' and o.expira_en > now()))
               and o.motivo_cortesia is not null)::int as cortesias_count,

           (select count(*) from public.boleto b
             where b.evento_id = e.id
               and b.estado in ('pagado','activado','dorsal_asignado','entregado'))::int as pagados,

           (select count(*) from public.boleto b
             where b.evento_id = e.id and b.activado_en is not null)::int as activados,

           (select count(*) from public.boleto b
             where b.evento_id = e.id
               and b.estado in ('pagado','dorsal_asignado')
               and b.activado_en is null)::int as sin_activar,

           (select count(*) from public.orden o
             where o.evento_id = e.id
               and o.estado = 'pendiente' and o.expira_en > now())::int as pendientes_pago,

           (select count(*) from public.boleto b
             where b.evento_id = e.id and b.estado = 'entregado')::int as entregados,

           (select coalesce(sum(o.monto_inscripcion + o.monto_donativo), 0)
              from public.orden o
             where o.evento_id = e.id and o.estado = 'pagada')::int as recaudado,

           (select coalesce(sum(o.monto_donativo), 0)
              from public.orden o
             where o.evento_id = e.id and o.estado = 'pagada')::int as donativos

      from public.evento e
      left join public.tipo_boleto tb on tb.evento_id = e.id
     where e.slug = ${slug}
     group by e.id
  `);

  const f = filas[0];
  if (!f) return null;

  return {
    evento: {
      id: f.id, nombre: f.nombre, estado: f.estado,
      fecha_carrera: f.fecha_carrera, sede: f.sede,
    },
    cupoTotal: f.cupo_total,
    vendidos: f.vendidos,
    disponibles: Math.max(0, f.cupo_total - f.vendidos),
    pagados: f.pagados,
    activados: f.activados,
    sinActivar: f.sin_activar,
    pendientesDePago: f.pendientes_pago,
    entregados: f.entregados,
    recaudadoCentavos: f.recaudado,
    donativosCentavos: f.donativos,
    vendidosDigitales: f.vendidos_digitales,
    vendidosFisicos: f.vendidos_fisicos,
    cortesias: f.cortesias_count,
  };
}

export type FilaPadron = {
  id: string;
  dorsal: number | null;
  nombre: string | null;
  apellidos: string | null;
  correo: string | null;
  talla_playera: string | null;
  estado: string;
  folio: string;
  entregado: boolean;
  qr: string;
};

/**
 * Padrón que el escáner cachea antes de abrir.
 *
 * Se manda con el token de QR ya calculado: así el dispositivo compara lo que
 * lee contra esta lista y decide **sin conexión**. El wifi de una explanada
 * siempre falla; pedirle al servidor por cada persona es garantía de fila.
 */
export async function padronParaEscaner(eventoId: string): Promise<FilaPadron[]> {
  const filas = await conReintento(() => db()<
    Omit<FilaPadron, "qr">[]
  >`
    select b.id, b.dorsal, b.nombre, b.apellidos, b.correo, b.talla_playera,
           b.estado::text as estado, o.folio,
           exists (select 1 from public.checkin c
                    where c.boleto_id = b.id and c.tipo = 'kit') as entregado
      from public.boleto b
      join public.orden o on o.id = b.orden_id
     where b.evento_id = ${eventoId}
       and b.estado in ('pagado','activado','dorsal_asignado','entregado')
     order by b.dorsal nulls last, b.apellidos, b.nombre
  `);

  return filas.map((f) => ({ ...f, qr: crearTokenQr(f.id) }));
}

export type ResultadoCheckin = {
  boletoId: string;
  resultado: "entregado" | "repetido" | "no_encontrado" | "sin_activar";
  nombre?: string;
  dorsal?: number | null;
  registradoEn?: Date;
};

/**
 * Registra la entrega del kit.
 *
 * "El primero gana": el segundo escaneo del mismo boleto no crea otro
 * registro ni rechaza en silencio — devuelve `repetido` con la hora del
 * primero, para que quien está en la mesa decida. Casi siempre es la misma
 * persona que volvió a mostrar el QR, pero a veces es alguien intentando
 * recoger dos veces, y esa distinción la hace un humano, no el software.
 */
export async function registrarEntregaKit(
  boletoId: string,
  registradoPor: string,
  notas?: string,
): Promise<ResultadoCheckin> {
  return enTransaccion(async (tx) => {
    const [boleto] = await tx<
      { id: string; evento_id: string; estado: string; nombre: string | null;
        apellidos: string | null; dorsal: number | null; activado_en: Date | null }[]
    >`
      select id, evento_id, estado::text as estado, nombre, apellidos, dorsal, activado_en
        from public.boleto where id = ${boletoId} for update
    `;

    if (!boleto) return { boletoId, resultado: "no_encontrado" };

    const nombre = [boleto.nombre, boleto.apellidos].filter(Boolean).join(" ");

    if (!boleto.activado_en) {
      return { boletoId, resultado: "sin_activar", nombre, dorsal: boleto.dorsal };
    }

    const previo = await tx<{ registrado_en: Date }[]>`
      select registrado_en from public.checkin
       where boleto_id = ${boletoId} and tipo = 'kit'
    `;
    if (previo.length) {
      return {
        boletoId,
        resultado: "repetido",
        nombre,
        dorsal: boleto.dorsal,
        registradoEn: previo[0].registrado_en,
      };
    }

    await tx`
      insert into public.checkin (evento_id, boleto_id, tipo, registrado_por, notas)
      values (${boleto.evento_id}, ${boletoId}, 'kit', ${registradoPor}, ${notas ?? null})
    `;
    await tx`
      update public.boleto set estado = 'entregado'
       where id = ${boletoId} and estado in ('activado','dorsal_asignado')
    `;

    return { boletoId, resultado: "entregado", nombre, dorsal: boleto.dorsal };
  });
}

export class SinRangoDeDorsales extends Error {
  constructor() {
    super(
      "El tipo de boleto no tiene rango de dorsales configurado. Lo define el " +
        "cronometrista; cárgalo con run:abrir --dorsales=1000-1999 antes de asignar.",
    );
    this.name = "SinRangoDeDorsales";
  }
}

export class RangoAgotado extends Error {
  constructor(readonly hasta: number) {
    super(`Se acabó el rango de dorsales (termina en ${hasta}).`);
    this.name = "RangoAgotado";
  }
}

/**
 * Asigna dorsales a los boletos activados que aún no tienen.
 *
 * El contador se toma con `SELECT ... FOR UPDATE`, nunca con MAX(dorsal)+1:
 * en la hora pico de una preventa, dos asignaciones simultáneas leen el mismo
 * máximo y emiten duplicados que se descubren el día de la entrega de kits,
 * con dos personas y un solo número.
 */
export async function asignarDorsales(
  tipoBoletoId: string,
  limite = 500,
): Promise<{ asignados: number; desde: number | null; hasta: number | null }> {
  return enTransaccion(async (tx) => {
    const [tipo] = await tx<{ dorsal_desde: number | null; dorsal_hasta: number | null }[]>`
      select dorsal_desde, dorsal_hasta from public.tipo_boleto where id = ${tipoBoletoId}
    `;
    if (!tipo?.dorsal_desde || !tipo.dorsal_hasta) throw new SinRangoDeDorsales();

    const [seq] = await tx<{ siguiente: number }[]>`
      select siguiente from public.dorsal_secuencia
       where tipo_boleto_id = ${tipoBoletoId} for update
    `;
    if (!seq) throw new SinRangoDeDorsales();

    let siguiente = Math.max(seq.siguiente, tipo.dorsal_desde);

    const pendientes = await tx<{ id: string }[]>`
      select id from public.boleto
       where tipo_boleto_id = ${tipoBoletoId}
         and dorsal is null
         and activado_en is not null
         and estado in ('activado','pagado')
       order by activado_en
       limit ${limite}
    `;

    let asignados = 0;
    const primero = siguiente;

    for (const boleto of pendientes) {
      if (siguiente > tipo.dorsal_hasta) throw new RangoAgotado(tipo.dorsal_hasta);
      await tx`
        update public.boleto
           set dorsal = ${siguiente}, estado = 'dorsal_asignado'
         where id = ${boleto.id}
      `;
      siguiente += 1;
      asignados += 1;
    }

    await tx`
      update public.dorsal_secuencia set siguiente = ${siguiente}
       where tipo_boleto_id = ${tipoBoletoId}
    `;

    return {
      asignados,
      desde: asignados ? primero : null,
      hasta: asignados ? siguiente - 1 : null,
    };
  });
}
