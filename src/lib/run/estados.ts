import "server-only";
import type postgres from "postgres";

export type EstadoOrden =
  | "pendiente"
  | "pagada"
  | "expirada"
  | "cancelada"
  | "reembolsada";

export type EstadoBoleto =
  | "pendiente"
  | "pagado"
  | "activado"
  | "dorsal_asignado"
  | "entregado"
  | "cancelado";

/**
 * Máquina de estados de la inscripción.
 *
 *   pendiente ──(cron, TTL vencido)──> expirada        [libera cupo]
 *       │
 *       └──(webhook confirma)────────> pagada          [cupo firme]
 *                                        │
 *                                        └──(reembolso)──> reembolsada
 *
 * Vive en una sola función a propósito. En cuanto los cambios de estado se
 * reparten entre endpoints, cada uno aplica su propia versión de las reglas
 * y el sistema empieza a contradecirse.
 */
const TRANSICIONES: Record<EstadoOrden, readonly EstadoOrden[]> = {
  pendiente: ["pagada", "expirada", "cancelada"],
  pagada: ["reembolsada", "cancelada"],
  expirada: [],
  cancelada: [],
  reembolsada: [],
};

/** Qué le pasa a los boletos de la orden en cada estado destino. */
const BOLETO_SEGUN_ORDEN: Partial<Record<EstadoOrden, EstadoBoleto>> = {
  pagada: "pagado",
  expirada: "cancelado",
  cancelada: "cancelado",
  reembolsada: "cancelado",
};

export type ResultadoTransicion =
  | { cambio: true; anterior: EstadoOrden; nuevo: EstadoOrden }
  | { cambio: false; motivo: "ya_estaba" | "orden_inexistente" | "no_permitida"; actual?: EstadoOrden };

/**
 * Mueve una orden de estado dentro de una transacción.
 *
 * Toma la fila con `FOR UPDATE`, así que dos entregas simultáneas del mismo
 * webhook se serializan: la segunda encuentra la orden ya pagada y sale con
 * `cambio: false`. Es la segunda red de la idempotencia, después de la clave
 * única del pago.
 */
export async function aplicarTransicionOrden(
  tx: postgres.TransactionSql,
  ordenId: string,
  destino: EstadoOrden,
): Promise<ResultadoTransicion> {
  const filas = await tx<{ estado: EstadoOrden }[]>`
    select estado from public.orden where id = ${ordenId} for update
  `;

  const actual = filas[0]?.estado;
  if (!actual) return { cambio: false, motivo: "orden_inexistente" };
  if (actual === destino) return { cambio: false, motivo: "ya_estaba", actual };

  if (!TRANSICIONES[actual].includes(destino)) {
    return { cambio: false, motivo: "no_permitida", actual };
  }

  // Al pagar se suelta el TTL: el cupo deja de ser una reserva y pasa a ser firme.
  await tx`
    update public.orden
       set estado    = ${destino}::public.estado_orden,
           expira_en = ${destino === "pagada" ? null : tx`expira_en`}
     where id = ${ordenId}
  `;

  const estadoBoleto = BOLETO_SEGUN_ORDEN[destino];
  if (estadoBoleto) {
    await tx`
      update public.boleto
         set estado = ${estadoBoleto}::public.estado_boleto
       where orden_id = ${ordenId}
         -- Un boleto ya activado o entregado no retrocede por un cambio en
         -- la orden; eso se resuelve por soporte, no por cascada.
         and estado in ('pendiente', 'pagado')
    `;
  }

  return { cambio: true, anterior: actual, nuevo: destino };
}
