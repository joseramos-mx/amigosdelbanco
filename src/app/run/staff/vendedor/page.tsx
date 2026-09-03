import { paseActual } from "@/lib/run/staff";
import { redirect } from "next/navigation";
import { foliosCapturadosPorVendedor } from "@/lib/run/captura-fisicos";

import BotonSalir from "../BotonSalir";
import CapturaFisicos from "../CapturaFisicos";
import BoletosCapturadosClient from "../BoletosCapturadosClient";

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

        <BoletosCapturadosClient boletos={boletos} />
      </div>
    </main>
  );
}