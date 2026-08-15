import { paseActual } from "@/lib/run/staff";
import { redirect } from "next/navigation";

import BotonSalir from "../BotonSalir";

export default async function VendedorPage() {
  const pase = await paseActual();
  if (pase?.rol !== "vendedor" && pase?.rol !== "admin") {
    redirect("/run/staff");
  }

  return (
    <main className="min-h-svh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
            Panel de Vendedor
          </h1>
          <BotonSalir />
        </div>
        <p className="mt-4 text-white/60">
          Esta página está en construcción. Aquí estará la captura manual de boletos físicos.
        </p>
      </div>
    </main>
  );
}
