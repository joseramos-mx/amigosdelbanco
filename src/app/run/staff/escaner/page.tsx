import Link from "next/link";
import { obtenerEvento } from "@/lib/run/inscripciones";
import { padronParaEscaner } from "@/lib/run/padron";
import { paseActual } from "@/lib/run/staff";
import Escaner from "./Escaner";

export const dynamic = "force-dynamic";

/**
 * El padrón se manda ya renderizado, no se pide desde el cliente: cuando la
 * persona abre esto todavía está en la oficina con wifi, y a partir de ahí el
 * dispositivo trabaja con lo que se llevó.
 */
export default async function EscanerPage() {
  const pase = await paseActual();
  const evento = await obtenerEvento();
  const padron = evento ? await padronParaEscaner(evento.id) : [];

  return (
    <main className="min-h-svh px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
            Entrega de kits
          </h1>
          {pase?.rol === "admin" && (
            <Link
              href="/run/staff"
              className="font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-run-amber"
            >
              Panel
            </Link>
          )}
        </div>
        <p className="mt-2 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          {pase?.nombre}
        </p>

        <div className="mt-8">
          <Escaner padronInicial={padron} />
        </div>
      </div>
    </main>
  );
}
