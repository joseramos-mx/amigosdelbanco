import "server-only";
import { enTransaccion } from "@/lib/db";
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

export type DatosCaptura = {
  folio: string; // Ej: "GG-00001"
  nombre: string;
  telefono: string;
  correo: string;
};

export async function capturarFisico(
  datos: DatosCaptura, 
  vendedorId: string
): Promise<{ ok: boolean; ordenId: string }> {
  return enTransaccion(async (tx) => {
    // Buscar la orden y bloquearla
    const [orden] = await tx<{ id: string; correo_comprador: string | null }[]>`
      select id, correo_comprador
        from public.orden
       where folio = ${datos.folio}
         and estado = 'pagada'
       for update
    `;

    if (!orden) throw new FolioNoEncontrado();

    // Si el correo no es el placeholder, significa que ya fue capturado (o fue venta digital)
    if (orden.correo_comprador !== 'venta.fisica@bancodurango.org') {
      throw new FolioYaCapturado();
    }

    // Actualizar la orden con los datos del comprador
    await tx`
      update public.orden
         set nombre_comprador = ${datos.nombre},
             correo_comprador = ${datos.correo},
             vendedor_id = ${vendedorId}
       where id = ${orden.id}
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
