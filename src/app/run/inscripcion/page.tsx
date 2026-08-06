import type { Metadata } from "next";
import Link from "next/link";
import Countdown from "../Countdown";
import RunNav from "../RunNav";
import SeccionKit from "../SeccionKit";
import { formatMxn } from "@/lib/donation";
import { hayBaseDeDatos } from "@/lib/db";
import { cupoDisponible, obtenerEvento, obtenerTiposBoleto } from "@/lib/run/inscripciones";
import FormInscripcion, { type OpcionBoleto } from "./FormInscripcion";

/**
 * Cuándo abre la venta.
 *
 * Ojo: esto solo mueve el reloj. Quien de verdad abre la venta es el estado
 * `venta_abierta` del evento en la base, que se prende con
 * `scripts/run-abrir-venta.mjs`. Si el reloj llega a cero y nadie corrió ese
 * comando, la página sigue diciendo que no abre — que es lo correcto, porque
 * de veras no abrió.
 */
const APERTURA_ISO = "2026-08-19T00:00:00-06:00";

/** Respaldo del precio para cuando la base no responde. */
const PRECIO_CENTAVOS_RESPALDO = 39_900;

export const metadata: Metadata = {
  title: { absolute: "Inscripción — Social Run 2026" },
  description:
    "Asegura tu Founding Member Pass del Social Run 2026 de Generous Generation. Pago con tarjeta, OXXO o SPEI.",
  robots: { index: false, follow: true },
};

// El cupo cambia con cada compra: nada que cachear.
export const dynamic = "force-dynamic";

type Datos = {
  eventoNombre: string;
  sede: string;
  ciudad: string;
  fechaCarrera: Date;
  abierto: boolean;
  opciones: OpcionBoleto[];
};

async function cargar(): Promise<Datos | null> {
  if (!hayBaseDeDatos()) return null;
  try {
    const evento = await obtenerEvento();
    if (!evento) return null;

    const tipos = await obtenerTiposBoleto(evento.id);
    const opciones = await Promise.all(
      tipos.map(async (t) => ({
        id: t.id,
        nombre: t.nombre,
        precioCentavos: t.precio_centavos,
        disponibles: await cupoDisponible(t.id),
      })),
    );

    return {
      eventoNombre: evento.nombre,
      sede: evento.sede,
      ciudad: evento.ciudad,
      fechaCarrera: evento.fecha_carrera,
      abierto: evento.estado === "venta_abierta",
      opciones,
    };
  } catch (err) {
    console.error("[run/inscripcion] no se pudo cargar el evento:", err);
    return null;
  }
}

/**
 * Marco de la página.
 *
 * Mismo ancho y mismos márgenes laterales que `SeccionKit`, para que los
 * bloques de aquí arriba queden alineados con los de allá abajo. El margen de
 * abajo es el mismo hueco que separa a las tarjetas entre sí —`SeccionKit` no
 * trae margen arriba—, así que toda la columna respira igual.
 */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 pt-10 pb-3 sm:px-6 lg:px-12 lg:pt-16 lg:pb-4">
      <div className="mx-auto max-w-[1500px]">
        <Link
          href="/run"
          className="font-geist-mono text-[11px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-run-amber"
        >
          ← Social Run 2026
        </Link>
        {children}
      </div>
    </main>
  );
}

/**
 * Tarjeta de precio: un solo boleto, un solo precio.
 *
 * No enumera lo que trae el boleto. Eso lo enseña el Founder Kit que va
 * abajo, con foto de cada pieza — repetirlo aquí en texto era decir dos veces
 * lo mismo, y la versión con foto gana.
 */
function Precio({ centavos }: { centavos: number }) {
  return (
    <div className="flex flex-col justify-center rounded-[20px] bg-run-card px-6 py-8 text-center sm:px-8">
      {/* leading-none y no menos: schabo es una condensada alta, y con la
          interlínea por debajo de 1 los trazos se salen de su renglón hacia
          arriba y se montan sobre lo que tengan encima. */}
      <p className="mt-3 font-schabo text-[clamp(3.5rem,11vw,11rem)] leading-none tracking-tight">
        {formatMxn(centavos).replace(/\s*MXN$/, "")}
      </p>
      <p className="mt-1 font-geist-mono text-[13px] uppercase tracking-[0.18em] text-run-amber">
        Founding Member Pass
      </p>
    </div>
  );
}

export default async function InscripcionPage() {
  const datos = await cargar();

  const precioCentavos =
    datos?.opciones[0]?.precioCentavos ?? PRECIO_CENTAVOS_RESPALDO;

  if (!datos || !datos.abierto) {
    return (
      <>
        <Marco>
          <h1 className="mt-8 font-schabo text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.9]">
            La venta <span className="text-run-amber">aún no abre</span>
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-white/60">
            Estamos afinando los últimos detalles del Social Run 2026. El cupo se
            abre el 19 de agosto.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:h-[300px] lg:gap-4">
            <div className="flex flex-col justify-center rounded-[20px] bg-run-amber px-7 py-8 text-black sm:px-9 lg:px-12">
              <p className="text-center font-geist-mono text-[10px] uppercase tracking-[0.2em] text-black/60">
                La venta abre en
              </p>
              <Countdown
                targetIso={APERTURA_ISO}
                clase="mt-3 font-schabo text-[13vw] text-center leading-none tracking-tight tabular-nums sm:text-[3.6rem] lg:text-[clamp(3.6rem,11vw,12rem)]"
                // No dice "ya abrió" al llegar a cero: quien abre la venta es
                // el estado del evento en la base, no este reloj.
                alLlegar="Muy pronto"
              />
            </div>

            <Precio centavos={precioCentavos} />
          </div>
        </Marco>

        <SeccionKit />

        {/* Hueco para que la barra fija no se coma el final. */}
        <div aria-hidden className="h-24 sm:h-28" />
        <RunNav base="/run" ctaHref="/run" ctaCorta="Evento" ctaLarga="Volver al evento" />
      </>
    );
  }

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeZone: "America/Monterrey",
  }).format(datos.fechaCarrera);

  // La tarjeta dice "un solo precio", así que solo aplica cuando de veras hay
  // uno. Con varios tipos vuelve la lista, que sí los distingue.
  const unSoloTipo = datos.opciones.length === 1;

  return (
    <>
      <Marco>
        <h1 className="mt-8 font-schabo text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.9]">
          Compra tu <span className="text-run-amber">acceso</span>
        </h1>
        <p className="mt-4 font-geist-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
          {fecha} · {datos.sede} · {datos.ciudad}
        </p>

        {unSoloTipo ? (
          <>
            <div className="mt-10">
              <Precio centavos={precioCentavos} />
            </div>
            <p className="mt-4 text-sm text-white/50">
              {datos.opciones[0].disponibles > 0
                ? `${datos.opciones[0].disponibles} lugares disponibles`
                : "Agotado"}
            </p>
          </>
        ) : (
          <div className="mt-8 space-y-2">
            {datos.opciones.map((o) => (
              <p key={o.id} className="text-sm text-white/60">
                <span className="text-white">{o.nombre}</span> —{" "}
                {formatMxn(o.precioCentavos)} ·{" "}
                {o.disponibles > 0 ? `${o.disponibles} lugares disponibles` : "agotado"}
              </p>
            ))}
          </div>
        )}

        {/* La forma no se va a lo ancho aunque el marco sí: campos de 1500
            píxeles se leen mal y el ojo pierde el renglón entre uno y otro. */}
        <div className="max-w-2xl">
          <FormInscripcion opciones={datos.opciones} />
        </div>
      </Marco>

      <SeccionKit />

      {/* Hueco para que la barra fija no se coma el final. */}
      <div aria-hidden className="h-24 sm:h-28" />
      <RunNav base="/run" ctaHref="/run" ctaCorta="Evento" ctaLarga="Volver al evento" />
    </>
  );
}
