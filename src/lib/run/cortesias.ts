import "server-only";
import { randomUUID } from "node:crypto";
import { enTransaccion } from "@/lib/db";
import { CupoInsuficiente, type Evento, type TipoBoleto } from "./inscripciones";
import { crearTokenActivacion } from "./tokens";

/**
 * Emisión de cortesías.
 *
 * Un boleto sin cobro no es una venta con descuento: nace pagado, con monto
 * cero y método `cortesia`. Así el panel y las exportaciones cuadran contra
 * el estado de cuenta de Stripe sin restar nada a mano.
 *
 * Fuera de eso se comporta como cualquier inscripción: ocupa cupo, genera
 * ligas de activación y el corredor llena sus datos, acepta la responsiva y
 * recibe su boleto con QR. Por eso sirve para validar el flujo completo
 * antes de abrir venta.
 *
 * La venta cerrada no impide emitirlas: el estado del evento gobierna la
 * compra pública, no lo que coordinación decide regalar.
 */

export type NuevaCortesia = {
  evento: Evento;
  tipoBoleto: TipoBoleto;
  cantidad: number;
  correo: string;
  nombre: string;
  motivo: string;
  emitidaPor: string;
};

export type CortesiaCreada = {
  ordenId: string;
  folio: string;
  tokens: string[];
};

export async function crearCortesia(datos: NuevaCortesia): Promise<CortesiaCreada> {
  const { evento, tipoBoleto, cantidad } = datos;
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

    // Nace pagada y sin TTL: no hay pago que esperar.
    const [orden] = await tx<{ id: string; folio: string }[]>`
      insert into public.orden (
        evento_id, correo_comprador, nombre_comprador,
        monto_inscripcion, monto_donativo, estado, expira_en, motivo_cortesia
      ) values (
        ${evento.id}, ${datos.correo}, ${datos.nombre},
        0, 0, 'pagada', null, ${datos.motivo}
      )
      returning id, folio
    `;

    const boletos = Array.from({ length: cantidad }, () => {
      const id = randomUUID();
      return { id, token: crearTokenActivacion(id, expiraToken) };
    });

    for (const b of boletos) {
      await tx`
        insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado, token_activacion)
        values (${b.id}, ${evento.id}, ${orden.id}, ${tipoBoleto.id}, 'pagado', ${b.token})
      `;
    }

    // Queda registrado como pago para que la orden tenga su rastro completo,
    // igual que cualquier otra. El monto es cero y el método lo distingue.
    await tx`
      insert into public.pago (
        evento_id, orden_id, proveedor, metodo, idempotency_key,
        monto_centavos, estado, procesado_en, payload_crudo
      ) values (
        ${evento.id}, ${orden.id}, 'cortesia', 'cortesia',
        ${`cortesia:${orden.id}`}, 0, 'confirmado', now(),
        ${JSON.stringify({ motivo: datos.motivo, emitidaPor: datos.emitidaPor })}::jsonb
      )
    `;

    return { ordenId: orden.id, folio: orden.folio, tokens: boletos.map((b) => b.token) };
  });
}
