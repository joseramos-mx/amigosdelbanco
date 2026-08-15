import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerEvento } from "@/lib/run/inscripciones";
import { padronParaEscaner } from "@/lib/run/padron";
import { paseActual } from "@/lib/run/staff";
import Escaner from "../../escaner/Escaner";
import BotonSalir from "../../BotonSalir";

export const dynamic = "force-dynamic";

export default async function AdminEscanerPage() {
  const pase = await paseActual();
  if (pase?.rol !== "admin") {
    redirect("/run/staff");
  }
  
  const evento = await obtenerEvento();
  const padron = evento ? await padronParaEscaner(evento.id) : [];

  return (
    <main className="min-h-svh px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
            Entrega de kits
          </h1>
          <div className="flex items-center gap-4">
            <BotonSalir />
            <Link
              href="/run/staff/admin"
              className="font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-run-amber"
            >
              Regresar al Panel
            </Link>
          </div>
        </div>
        <p className="mt-2 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          Administrador: {pase?.nombre}
        </p>

        <div className="mt-8">
          <Escaner padronInicial={padron} />
        </div>
      </div>
    </main>
  );
}
