import "server-only";
import { randomUUID } from "node:crypto";
import { conReintento, db, enTransaccion } from "@/lib/db";
import { aplicarTransicionOrden } from "./estados";
import { crearTokenActivacion } from "./tokens";

export const EVENTO_SLUG = "social-run-2026";

/** Tope por compra. Arriba de esto es venta de grupo y se atiende a mano. */
export const MAX_BOLETOS_POR_ORDEN = 30;

export type Evento = {
  id: string;
  nombre: string;
  slug: string;
  fecha_carrera: Date;
  sede: string;
  ciudad: string;
  estado: "borrador" | "venta_abierta" | "venta_cerrada" | "finalizado";
  ttl_reserva_horas: number;
};

export type TipoBoleto = {
  id: string;
  evento_id: string;
  nombre: string;
  precio_centavos: number;
  cupo_total: number;
  dorsal_desde: number | null;
  dorsal_hasta: number | null;
};

export async function obtenerEvento(slug = EVENTO_SLUG): Promise<Evento | null> {
  const filas = await conReintento(() => db()<Evento[]>`
    select id, nombre, slug, fecha_carrera, sede, ciudad, estado, ttl_reserva_horas
      from public.evento
     where slug = ${slug}
  `);
  return filas[0] ?? null;
}

export async function obtenerTiposBoleto(eventoId: string): Promise<TipoBoleto[]> {
  return conReintento(() => db()<TipoBoleto[]>`
    select id, evento_id, nombre, precio_centavos::int as precio_centavos,
           cupo_total, dorsal_desde, dorsal_hasta
      from public.tipo_boleto
     where evento_id = ${eventoId}
     order by precio_centavos, nombre
  `);
}

/**
 * Cupo disponible = cupo_total − (boletos de órdenes pagadas + pendientes vigentes).
 *
 * Contar solo las pagadas sobrevende: mientras alguien tiene una referencia
 * OXXO viva su lugar está apartado. Contar todas las pendientes sin mirar
 * `expira_en` agota el evento con órdenes muertas.
 *
 * Va como subconsulta y no como LEFT JOIN + WHERE (que es como está en la
 * referencia del skill): ese WHERE filtra las filas del join y, cuando el
 * tipo de boleto todavía no tiene ningún boleto, la consulta no devuelve
 * ninguna fila en lugar de devolver el cupo completo.
 */
export async function cupoDisponible(tipoBoletoId: string): Promise<number> {
  const filas = await conReintento(() => db()<{ disponibles: number }[]>`
    select tb.cupo_total - (
             select count(*)
               from public.boleto b
               join public.orden  o on o.id = b.orden_id
              where b.tipo_boleto_id = tb.id
                and (o.estado = 'pagada'
                     or (o.estado = 'pendiente' and o.expira_en > now()))
           )::int as disponibles
      from public.tipo_boleto tb
     where tb.id = ${tipoBoletoId}
  `);
  return filas[0]?.disponibles ?? 0;
}

export class CupoInsuficiente extends Error {
  constructor(readonly disponibles: number) {
    super(`Solo quedan ${disponibles} lugares disponibles.`);
    this.name = "CupoInsuficiente";
  }
}

export class VentaCerrada extends Error {
  constructor(readonly estado: string) {
    super("La venta de este evento no está abierta.");
    this.name = "VentaCerrada";
  }
}

export type DatosFactura = {
  rfc?: string;
  razonSocial?: string;
  usoCfdi?: string;
  regimenFiscal?: string;
  cpFiscal?: string;
  correoFactura?: string;
};

export type NuevaOrden = {
  evento: Evento;
  tipoBoleto: TipoBoleto;
  cantidad: number;
  correoComprador: string;
  nombreComprador: string;
  telefono?: string;
  /** Aportación voluntaria adicional, en centavos. Deducible; la inscripción no. */
  donativoCentavos: number;
  factura?: DatosFactura;
};

export type OrdenCreada = {
  id: string;
  folio: string;
  montoInscripcion: number;
  montoDonativo: number;
  expiraEn: Date;
  boletoIds: string[];
};

/**
 * Crea la orden en `pendiente` con su reserva de cupo.
 *
 * Todo ocurre dentro de una transacción que arranca tomando el tipo de
 * boleto con `FOR UPDATE`: sin ese lock, dos compras simultáneas leen el
 * mismo cupo disponible y las dos pasan la validación.
 */
export async function crearOrdenPendiente(datos: NuevaOrden): Promise<OrdenCreada> {
  const { evento, tipoBoleto, cantidad } = datos;

  if (evento.estado !== "venta_abierta") throw new VentaCerrada(evento.estado);

  const montoInscripcion = tipoBoleto.precio_centavos * cantidad;
  const expiraEn = new Date(Date.now() + evento.ttl_reserva_horas * 3_600_000);

  // El token de activación caduca un día después de la carrera: a partir de
  // ahí no hay nada que activar.
  const expiraToken = new Date(evento.fecha_carrera.getTime() + 86_400_000);

  return enTransaccion(async (tx) => {
    await tx`select id from public.tipo_boleto where id = ${tipoBoleto.id} for update`;

    const [{ disponibles }] = await tx<{ disponibles: number }[]>`
      select tb.cupo_total - (
               select count(*)
                 from public.boleto b
                 join public.orden  o on o.id = b.orden_id
                where b.tipo_boleto_id = tb.id
                  and (o.estado = 'pagada'
                       or (o.estado = 'pendiente' and o.expira_en > now()))
             )::int as disponibles
        from public.tipo_boleto tb
       where tb.id = ${tipoBoleto.id}
    `;

    if (cantidad > disponibles) throw new CupoInsuficiente(disponibles);

    const [orden] = await tx<{ id: string; folio: string }[]>`
      insert into public.orden (
        evento_id, correo_comprador, nombre_comprador, telefono,
        monto_inscripcion, monto_donativo, estado, expira_en,
        requiere_factura, rfc, razon_social, uso_cfdi, regimen_fiscal,
        cp_fiscal, correo_factura
      ) values (
        ${evento.id}, ${datos.correoComprador}, ${datos.nombreComprador},
        ${datos.telefono ?? null},
        ${montoInscripcion}, ${datos.donativoCentavos}, 'pendiente', ${expiraEn},
        ${Boolean(datos.factura?.rfc)}, ${datos.factura?.rfc ?? null},
        ${datos.factura?.razonSocial ?? null}, ${datos.factura?.usoCfdi ?? null},
        ${datos.factura?.regimenFiscal ?? null}, ${datos.factura?.cpFiscal ?? null},
        ${datos.factura?.correoFactura ?? null}
      )
      returning id, folio
    `;

    // Los ids se generan aquí y no en la base para poder firmar el token
    // antes del insert: el token contiene el id del boleto.
    const boletos = Array.from({ length: cantidad }, () => {
      const id = randomUUID();
      return { id, token: crearTokenActivacion(id, expiraToken) };
    });

    for (const b of boletos) {
      await tx`
        insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado, token_activacion)
        values (${b.id}, ${evento.id}, ${orden.id}, ${tipoBoleto.id}, 'pendiente', ${b.token})
      `;
    }

    return {
      id: orden.id,
      folio: orden.folio,
      montoInscripcion,
      montoDonativo: datos.donativoCentavos,
      expiraEn,
      boletoIds: boletos.map((b) => b.id),
    };
  });
}

export async function guardarSesionStripe(ordenId: string, sessionId: string): Promise<void> {
  await db()`update public.orden set stripe_session_id = ${sessionId} where id = ${ordenId}`;
}

/** Extiende la reserva a la vigencia real del voucher OXXO / SPEI. */
export async function extenderReserva(ordenId: string, hasta: Date): Promise<void> {
  await db()`
    update public.orden
       set expira_en = ${hasta}
     where id = ${ordenId}
       and estado = 'pendiente'
       and (expira_en is null or expira_en < ${hasta})
  `;
}

/**
 * Cancela una orden y suelta su cupo. Se usa cuando la compra se cae después
 * de haber apartado lugar — por ejemplo si Stripe rechaza la sesión.
 */
export async function cancelarOrden(ordenId: string): Promise<void> {
  await enTransaccion((tx) => aplicarTransicionOrden(tx, ordenId, "cancelada"));
}
