import { paseActual } from "@/lib/run/staff";
import { redirect } from "next/navigation";
import FormularioContrasena from "./FormularioContrasena";

export const dynamic = "force-dynamic";

export default async function CambiarContrasenaPage() {
  const pase = await paseActual();
  if (!pase) {
    redirect("/run/login");
  }

  return (
    <main className="min-h-svh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <FormularioContrasena />
      </div>
    </main>
  );
}
