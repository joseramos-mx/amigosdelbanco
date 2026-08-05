import type { Metadata } from "next";
import Link from "next/link";
import { TokenInvalido, boletoPorToken } from "@/lib/run/activacion";
import { responsivaVigente } from "@/lib/run/responsiva";
import FormActivacion from "./FormActivacion";

export const metadata: Metadata = {
  title: { absolute: "Activa tu boleto — Social Run 2026" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Marco>
      <h1 className="mt-8 font-schabo text-[clamp(2.2rem,6vw,3.5rem)] uppercase leading-[0.9]">
        {titulo}
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-white/60">{texto}</p>
      <p className="mt-6 text-sm text-white/40">
        Si crees que es un error, escríbenos a{" "}
        <a
          href="mailto:informacion@bancodealimentosdurango.org"
          className="text-run-amber underline-offset-4 hover:underline"
        >
          informacion@bancodealimentosdurango.org
        </a>
      </p>
    </Marco>
  );
}

export default async function ActivarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let boleto;
  try {
    boleto = await boletoPorToken(token);
  } catch (err) {
    if (err instanceof TokenInvalido) {
      return <Aviso titulo="Liga no válida" texto={err.message} />;
    }
    console.error("[run/activar]", err);
    return (
      <Aviso
        titulo="Algo falló"
        texto="No pudimos cargar tu boleto. Intenta de nuevo en un momento."
      />
    );
  }

  if (boleto.estado === "pendiente") {
    return (
      <Aviso
        titulo="Falta el pago"
        texto="Todavía no nos llega la confirmación de tu pago. Si pagaste en OXXO, puede tardar unas horas en reflejarse; te avisamos por correo en cuanto entre."
      />
    );
  }

  if (boleto.estado === "cancelado") {
    return (
      <Aviso
        titulo="Boleto cancelado"
        texto="Este boleto ya no está activo. Si es un error, escríbenos y lo revisamos."
      />
    );
  }

  const fecha = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeZone: "America/Monterrey",
  }).format(boleto.fecha_carrera);

  const yaActivado = Boolean(boleto.activado_en);

  return (
    <Marco>
      <h1 className="mt-8 font-schabo text-[clamp(2.2rem,6vw,3.5rem)] uppercase leading-[0.9]">
        {yaActivado ? "Tus datos" : "Llena tus datos"}
      </h1>
      <p className="mt-4 font-geist-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
        {boleto.tipo_nombre} · folio {boleto.folio} · {fecha}
      </p>

      {yaActivado && (
        <div className="mt-6 rounded-lg border border-white/15 bg-white/5 px-4 py-3">
          <p className="text-sm text-white/70">
            Ya habías llenado esto{" "}
            {boleto.nombre ? `a nombre de ${boleto.nombre} ${boleto.apellidos ?? ""}` : ""}. Puedes
            corregirlo cuantas veces quieras antes del corte.
          </p>
          <a
            href={`/api/run/boleto/${token}/pdf`}
            className="mt-3 inline-block rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
          >
            Descargar mi boleto
          </a>
        </div>
      )}

      <FormActivacion
        token={token}
        responsiva={responsivaVigente()}
        yaActivado={yaActivado}
      />
    </Marco>
  );
}
