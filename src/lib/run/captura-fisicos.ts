import "server-only";
import { db, enTransaccion } from "@/lib/db";
import { enviarLigasActivacion } from "./correos";

export class FolioNoEncontrado extends Error {
  constructor() {
    super("El folio no existe o no es un boleto físico válido.");
    this.name = "FolioNoEncontrado";
  }
}

export class FolioYaCapturado extends Error {
  constructor() {
    super("Este folio ya fue capturado previamente.");
    this.name = "FolioYaCapturado";
  }
}

export class FolioAjeno extends Error {
  constructor() {
    super("Este folio no pertenece a tu rango asignado de folios.");
    this.name = "FolioAjeno";
  }
}

export type MetodoPago = "efectivo" | "transferencia" | "deposito";

export type DatosCaptura = {
  folio: string; // Ej: "GG-00001"
  nombre: string;
  telefono: string;
  correo: string;
  tipoPago: MetodoPago;
};

export async function capturarFisico(
  datos: DatosCaptura,
  vendedorId: string
): Promise<{ ok: boolean; ordenId: string }> {
  return enTransaccion(async (tx) => {
    // Buscar la orden y bloquearla
    const [orden] = await tx<{ id: string; evento_id: string; monto_inscripcion: number; correo_comprador: string | null; vendedor_id: string | null }[]>`
      select id, evento_id, monto_inscripcion, correo_comprador, vendedor_id
        from public.orden
       where folio = ${datos.folio}
         and estado = 'pendiente'
       for update
    `;

    if (!orden) throw new FolioNoEncontrado();

    if (orden.vendedor_id !== vendedorId) {
      throw new FolioAjeno();
    }

    // Si el correo no es el placeholder, significa que ya fue capturado (o fue venta digital)
    if (orden.correo_comprador !== 'venta.fisica@bancodurango.org') {
      throw new FolioYaCapturado();
    }

    // Obtener nombre del vendedor para el registro de pago
    const [vendedor] = await tx<{ nombre: string }[]>`
      select nombre from public.usuario_rol where id = ${vendedorId}
    `;
    const nombreVendedor = vendedor?.nombre || 'Vendedor Desconocido';

    // Actualizar la orden con los datos del comprador y marcarla pagada
    await tx`
      update public.orden
         set nombre_comprador = ${datos.nombre},
             correo_comprador = ${datos.correo},
             telefono = ${datos.telefono},
             vendedor_id = ${vendedorId},
             estado = 'pagada'
       where id = ${orden.id}
    `;

    // Marcar el boleto como pagado
    await tx`
      update public.boleto
         set estado = 'pagado'
       where orden_id = ${orden.id}
    `;

    // Registrar el pago
    await tx`
      insert into public.pago (
        evento_id, orden_id, proveedor, metodo, idempotency_key,
        monto_centavos, estado, procesado_en, payload_crudo
      ) values (
        ${orden.evento_id}, ${orden.id}, ${nombreVendedor}, ${datos.tipoPago},
        ${`fisico:${orden.id}`}, ${orden.monto_inscripcion}, 'confirmado', now(),
        '{"origen": "captura_fisica"}'::jsonb
      )
    `;

    // Buscar los tokens de los boletos de esta orden
    const boletos = await tx<{ token_activacion: string }[]>`
      select token_activacion
        from public.boleto
       where orden_id = ${orden.id}
    `;

    if (boletos.length === 0) throw new FolioNoEncontrado();

    // Enviar el correo con las ligas de activación
    const res = await enviarLigasActivacion({
      folio: datos.folio,
      correo: datos.correo,
      tokens: boletos.map((b) => b.token_activacion),
    });

    if (!res.ok) {
      console.error(`Error enviando correo de captura física a ${datos.correo}: ${res.error}`);
    }

    return { ok: true, ordenId: orden.id };
  });
}

export type BoletoCapturado = {
  folio: string;
  nombre_comprador: string;
  correo_comprador: string;
  telefono: string | null;
  creada_en: Date;
  estado: string;
};

export async function foliosCapturadosPorVendedor(vendedorId: string): Promise<BoletoCapturado[]> {
  const sql = db();
  return sql<BoletoCapturado[]>`
    select folio, nombre_comprador, correo_comprador, telefono, creada_en, estado
      from public.orden
     where vendedor_id = ${vendedorId}
     order by folio
  `;
}