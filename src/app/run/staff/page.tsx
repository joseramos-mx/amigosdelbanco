import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMxn } from "@/lib/donation";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";
import { resumen } from "@/lib/run/padron";
import { paseActual } from "@/lib/run/staff";
import AccionesPanel from "./AccionesPanel";
import Cortesias from "./Cortesias";
import CapturaFisicos from "./CapturaFisicos";
import RegistroStaff from "./RegistroStaff";

export const dynamic = "force-dynamic";

const EXPORTS: { tipo: string; nombre: string; para: string }[] = [
  { tipo: "cronometraje", nombre: "Padrón de cronometraje", para: "Cronometrista" },
  { tipo: "tallas", nombre: "Conteo de tallas", para: "Proveedor de playeras" },
  { tipo: "emergencias", nombre: "Contactos de emergencia", para: "Servicios médicos" },
  { tipo: "seguro", nombre: "Padrón para seguro", para: "Aseguradora" },
  { tipo: "no-activados", nombre: "Pagaron y no llenaron datos", para: "Soporte" },
  { tipo: "pendientes", nombre: "Pendientes de pago", para: "Soporte" },
];

function Dato({
  etiqueta,
  valor,
  nota,
  alerta,
}: {
  etiqueta: string;
  valor: string | number;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-run-card px-5 py-4">
      <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        {etiqueta}
      </p>
      <p
        className={`mt-2 font-schabo text-4xl uppercase leading-none ${alerta ? "text-run-amber" : "text-white"
          }`}
      >
        {valor}
      </p>
      {nota && <p className="mt-1 text-xs text-white/40">{nota}</p>}
    </div>
  );
}

export default async function PanelPage() {
  const pase = await paseActual();
  // El pase de escáner no ve el panel: solo entrega kits.
  if (pase?.rol !== "admin") redirect("/run/staff/escaner");

  const datos = await resumen(EVENTO_SLUG);
  if (!datos) {
    return (
      <main className="min-h-svh px-4 py-10 sm:px-6">
        <p className="text-white/60">El evento no está configurado.</p>
      </main>
    );
  }

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeZone: "America/Monterrey",
  }).format(datos.evento.fecha_carrera);

  return (
    <main className="min-h-svh px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
              Panel del evento
            </h1>
            <p className="mt-2 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              {fecha} · {datos.evento.sede} · venta {datos.evento.estado.replace("_", " ")}
            </p>
          </div>
          <Link
            href="/run/staff/escaner"
            className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
          >
            Escanear kits
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Dato
            etiqueta="Vendidos"
            valor={datos.vendidos}
            nota={`${datos.disponibles} disponibles de ${datos.cupoTotal}`}
          />
          <Dato
            etiqueta="Recaudado"
            valor={formatMxn(datos.recaudadoCentavos)}
            nota={`incluye ${formatMxn(datos.donativosCentavos)} en donativos`}
          />
          <Dato
            etiqueta="Sin llenar datos"
            valor={datos.sinActivar}
            nota="pagaron y falta su activación"
            alerta={datos.sinActivar > 0}
          />
          <Dato
            etiqueta="Kits entregados"
            valor={datos.entregados}
            nota={`de ${datos.activados} activados`}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Dato
            etiqueta="Pendientes de pago"
            valor={datos.pendientesDePago}
            nota="referencias vivas, apartando cupo"
          />
          <Dato etiqueta="Boletos pagados" valor={datos.pagados} />
        </div>

        <AccionesPanel />

        <Cortesias />

        <RegistroStaff />

        <CapturaFisicos />

        <section className="mt-10">
          <h2 className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Exportaciones
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {EXPORTS.map((e) => (
              <a
                key={e.tipo}
                href={`/api/run/export?tipo=${e.tipo}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-run-card px-4 py-3 transition-colors hover:border-run-amber/50"
              >
                <span>
                  <span className="block text-sm text-white">{e.nombre}</span>
                  <span className="block text-xs text-white/40">{e.para}</span>
                </span>
                <span className="font-geist-mono text-[10px] uppercase tracking-[0.16em] text-run-amber">
                  CSV
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
