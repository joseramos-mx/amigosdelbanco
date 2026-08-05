import "server-only";
import { conReintento, db, enTransaccion } from "@/lib/db";
import { responsivaVigente } from "./responsiva";
import { verificarTokenActivacion } from "./tokens";

/**
 * Activación del boleto — el segundo paso del registro.
 *
 * En la compra solo se pide lo mínimo. Aquí se piden los datos pesados, y por
 * eso vive en su propia pantalla: quien compró treinta lugares reparte una
 * liga a cada corredor y cada quien llena lo suyo.
 */

export type BoletoParaActivar = {
  id: string;
  estado: string;
  folio: string;
  evento_nombre: string;
  fecha_carrera: Date;
  sede: string;
  tipo_nombre: string;
  nombre: string | null;
  apellidos: string | null;
  activado_en: Date | null;
};

export type DatosCorredor = {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: "F" | "M" | "X";
  correo: string;
  telefono?: string;
  tallaPlayera: string;
  club?: string;
  nacionalidad?: string;
  contactoEmergNombre: string;
  contactoEmergTel: string;
  tipoSangre?: string;
  condicionesMedicas?: string;
};

export class TokenInvalido extends Error {
  constructor(readonly motivo: string) {
    super(
      motivo === "expirado"
        ? "Esta liga ya venció. Escríbenos y te mandamos una nueva."
        : "Esta liga no es válida.",
    );
    this.name = "TokenInvalido";
  }
}

export class BoletoNoPagado extends Error {
  constructor() {
    super("Este boleto todavía no tiene el pago confirmado.");
    this.name = "BoletoNoPagado";
  }
}

/** Lee el boleto detrás de una liga de activación. Valida la firma primero. */
export async function boletoPorToken(token: string): Promise<BoletoParaActivar> {
  const verificado = verificarTokenActivacion(token);
  if (!verificado.ok) throw new TokenInvalido(verificado.motivo);

  const filas = await conReintento(() => db()<BoletoParaActivar[]>`
    select b.id, b.estado::text as estado, b.nombre, b.apellidos, b.activado_en,
           o.folio,
           e.nombre as evento_nombre, e.fecha_carrera, e.sede,
           tb.nombre as tipo_nombre
      from public.boleto b
      join public.orden      o  on o.id  = b.orden_id
      join public.evento     e  on e.id  = b.evento_id
      join public.tipo_boleto tb on tb.id = b.tipo_boleto_id
     where b.id = ${verificado.boletoId}
  `);

  const boleto = filas[0];
  if (!boleto) throw new TokenInvalido("inexistente");
  return boleto;
}

/**
 * Guarda los datos del corredor y deja constancia de la responsiva.
 *
 * La edad se calcula **a la fecha de la carrera**, no a la de hoy: es como se
 * arman las categorías en cualquier evento. La categoría en sí queda nula
 * hasta que el organizador defina su tabla — inventarla aquí sería poner en
 * el dorsal una que no corresponde.
 */
export async function activarBoleto(
  token: string,
  datos: DatosCorredor,
  ip: string | null,
): Promise<{ boletoId: string; edadEnCarrera: number }> {
  const verificado = verificarTokenActivacion(token);
  if (!verificado.ok) throw new TokenInvalido(verificado.motivo);

  const responsiva = responsivaVigente();

  return enTransaccion(async (tx) => {
    const [boleto] = await tx<{ id: string; estado: string; fecha_carrera: Date }[]>`
      select b.id, b.estado::text as estado, e.fecha_carrera
        from public.boleto b
        join public.evento e on e.id = b.evento_id
       where b.id = ${verificado.boletoId}
       for update of b
    `;

    if (!boleto) throw new TokenInvalido("inexistente");
    // Se activa lo ya pagado. Un boleto pendiente significa que la referencia
    // sigue sin cobrarse.
    if (boleto.estado === "pendiente") throw new BoletoNoPagado();
    if (boleto.estado === "cancelado") throw new TokenInvalido("cancelado");

    const nacimiento = new Date(datos.fechaNacimiento);
    const carrera = boleto.fecha_carrera;
    let edad = carrera.getFullYear() - nacimiento.getFullYear();
    const cumpleDespues =
      carrera.getMonth() < nacimiento.getMonth() ||
      (carrera.getMonth() === nacimiento.getMonth() && carrera.getDate() < nacimiento.getDate());
    if (cumpleDespues) edad -= 1;

    await tx`
      update public.boleto
         set nombre                = ${datos.nombre},
             apellidos             = ${datos.apellidos},
             fecha_nacimiento      = ${datos.fechaNacimiento}::date,
             sexo                  = ${datos.sexo}::public.sexo,
             correo                = ${datos.correo},
             telefono              = ${datos.telefono ?? null},
             talla_playera         = ${datos.tallaPlayera},
             club                  = ${datos.club ?? null},
             nacionalidad          = ${datos.nacionalidad ?? null},
             contacto_emerg_nombre = ${datos.contactoEmergNombre},
             contacto_emerg_tel    = ${datos.contactoEmergTel},
             tipo_sangre           = ${datos.tipoSangre ?? null},
             condiciones_medicas   = ${datos.condicionesMedicas ?? null},
             responsiva_version    = ${responsiva.version},
             responsiva_aceptada   = now(),
             responsiva_ip         = ${ip},
             activado_en           = coalesce(activado_en, now()),
             estado                = case when estado = 'pagado' then 'activado'::public.estado_boleto
                                          else estado end
       where id = ${boleto.id}
    `;

    return { boletoId: boleto.id, edadEnCarrera: edad };
  });
}

/** Datos del boleto ya activado, para el PDF y el correo. */
export type BoletoCompleto = {
  id: string;
  estado: string;
  folio: string;
  nombre: string | null;
  apellidos: string | null;
  dorsal: number | null;
  categoria: string | null;
  talla_playera: string | null;
  tipo_nombre: string;
  evento_nombre: string;
  fecha_carrera: Date;
  sede: string;
  ciudad: string;
};

export async function boletoCompleto(boletoId: string): Promise<BoletoCompleto | null> {
  const filas = await conReintento(() => db()<BoletoCompleto[]>`
    select b.id, b.estado::text as estado, b.nombre, b.apellidos, b.dorsal,
           b.categoria, b.talla_playera,
           o.folio,
           tb.nombre as tipo_nombre,
           e.nombre as evento_nombre, e.fecha_carrera, e.sede, e.ciudad
      from public.boleto b
      join public.orden      o  on o.id  = b.orden_id
      join public.tipo_boleto tb on tb.id = b.tipo_boleto_id
      join public.evento     e  on e.id  = b.evento_id
     where b.id = ${boletoId}
  `);
  return filas[0] ?? null;
}
