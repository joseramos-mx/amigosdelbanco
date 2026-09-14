import { db } from "@/lib/db";
import { obtenerEvento } from "@/lib/run/inscripciones";
import TablaVentasClient from "./TablaVentasClient";

export default async function ListaVentas() {
  const evento = await obtenerEvento();
  if (!evento) return null;

  const sql = db();
  const boletos = await sql`
    SELECT 
      o.folio,
      coalesce(b.nombre, o.nombre_comprador) as nombre,
      b.apellidos,
      to_char(b.fecha_nacimiento, 'DD/MM/YYYY') as fecha_nacimiento,
      b.sexo,
      coalesce(b.correo, o.correo_comprador) as correo,
      b.telefono,
      b.talla_playera,
      b.club,
      b.contacto_emerg_nombre,
      b.contacto_emerg_tel,
      b.tipo_sangre,
      b.condiciones_medicas,
      b.categoria,
      b.dorsal,
      b.mood,
      case 
        when o.motivo_cortesia is not null then 'Cortesía'
        when o.vendedor_id is not null then 'Físico' 
        else 'Digital' 
      end as tipo_boleto
    FROM public.boleto b
    JOIN public.orden o ON o.id = b.orden_id
    WHERE b.evento_id = ${evento.id}
      AND b.estado IN ('pagado', 'activado', 'dorsal_asignado', 'entregado')
    ORDER BY o.folio ASC
  `;

  if (boletos.length === 0) {
    return <p className="mt-8 text-sm text-white/50">No hay boletos pagados aún.</p>;
  }

  // Convertimos a JSON-serializable stringificando todo para evitar problemas con números/fechas si los hubiera,
  // aunque Postgresjs ya devuelve strings para cosas complejas y la consulta hace to_char de la fecha.
  const boletosSerializables = boletos.map(b => ({
    folio: b.folio,
    nombre: b.nombre || "",
    apellidos: b.apellidos || "",
    fecha_nacimiento: b.fecha_nacimiento || "",
    sexo: b.sexo || "",
    correo: b.correo || "",
    telefono: b.telefono || "",
    talla_playera: b.talla_playera || "",
    club: b.club || "",
    contacto_emerg_nombre: b.contacto_emerg_nombre || "",
    contacto_emerg_tel: b.contacto_emerg_tel || "",
    tipo_sangre: b.tipo_sangre || "",
    condiciones_medicas: b.condiciones_medicas || "",
    categoria: b.categoria || "",
    dorsal: b.dorsal?.toString() || "",
    mood: b.mood || "",
    tipo_boleto: b.tipo_boleto || ""
  }));

  return (
    <section className="mt-10">
      <h2 className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        Listado de usuarios pagados
      </h2>
      <TablaVentasClient boletos={boletosSerializables} />
    </section>
  );
}
