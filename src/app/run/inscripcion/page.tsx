import type { Metadata } from "next";
import Link from "next/link";
import { formatMxn } from "@/lib/donation";
import { hayBaseDeDatos } from "@/lib/db";
import { cupoDisponible, obtenerEvento, obtenerTiposBoleto } from "@/lib/run/inscripciones";
import FormInscripcion, { type OpcionBoleto } from "./FormInscripcion";

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

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
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

export default async function InscripcionPage() {
  const datos = await cargar();

  if (!datos || !datos.abierto) {
    return (
      <Marco>
        <h1 className="mt-8 font-schabo text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.9]">
          La venta <span className="text-run-amber">aún no abre</span>
        </h1>
        <p className="mt-5 max-w-md leading-relaxed text-white/60">
          Estamos afinando los últimos detalles del Social Run 2026. En cuanto se
          abra el cupo lo anunciamos en la página del evento.
        </p>
        <Link
          href="/run"
          className="mt-8 inline-block rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
        >
          Volver al evento
        </Link>
      </Marco>
    );
  }

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeZone: "America/Monterrey",
  }).format(datos.fechaCarrera);

  return (
    <Marco>
      <h1 className="mt-8 font-schabo text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.9]">
        Compra tu <span className="text-run-amber">acceso</span>
      </h1>
      <p className="mt-4 font-geist-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
        {fecha} · {datos.sede} · {datos.ciudad}
      </p>

      <div className="mt-8 space-y-2">
        {datos.opciones.map((o) => (
          <p key={o.id} className="text-sm text-white/60">
            <span className="text-white">{o.nombre}</span> —{" "}
            {formatMxn(o.precioCentavos)} ·{" "}
            {o.disponibles > 0 ? `${o.disponibles} lugares disponibles` : "agotado"}
          </p>
        ))}
      </div>

      <FormInscripcion opciones={datos.opciones} />
    </Marco>
  );
}
