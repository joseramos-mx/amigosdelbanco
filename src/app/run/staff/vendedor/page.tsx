import { paseActual } from "@/lib/run/staff";
import { redirect } from "next/navigation";
import { foliosCapturadosPorVendedor } from "@/lib/run/captura-fisicos";

import BotonSalir from "../BotonSalir";
import CapturaFisicos from "../CapturaFisicos";

export default async function VendedorPage() {
  const pase = await paseActual();
  if (pase?.rol !== "vendedor" && pase?.rol !== "admin") {
    redirect("/run/staff");
  }

  const boletos = await foliosCapturadosPorVendedor(pase.id);

  return (
    <main className="min-h-svh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
            Panel de Vendedor
          </h1>
          <BotonSalir />
        </div>
        <p className="mt-4 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          Vendedor: {pase.nombre}
        </p>
        
        <CapturaFisicos />

        <section className="mt-10">
          <h2 className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Boletos Capturados ({boletos.length})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boletos.map((b) => (
              <div key={b.folio} className="rounded-xl border border-white/10 bg-run-card p-4">
                <p className="font-schabo text-3xl uppercase leading-none text-run-amber">
                  {b.folio}
                </p>
                <div className="mt-2 text-sm text-white/80">
                  <p>{b.nombre_comprador}</p>
                  <p className="text-white/40">{b.correo_comprador}</p>
                  {b.telefono && <p className="text-white/40">{b.telefono}</p>}
                </div>
                <p className="mt-3 text-right font-geist-mono text-[10px] uppercase text-white/20">
                  {new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(b.creada_en)}
                </p>
              </div>
            ))}
            {boletos.length === 0 && (
              <p className="text-sm text-white/40 col-span-full">
                Aún no has capturado ningún boleto físico.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
