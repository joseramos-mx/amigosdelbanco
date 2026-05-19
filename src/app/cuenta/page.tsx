import type { Metadata } from "next";
import CuentaForm from "./CuentaForm";

export const metadata: Metadata = {
  title: "Mi cuenta — Banco de Alimentos",
  description: "Gestiona tu donación al Banco de Alimentos de Durango.",
};

export default function CuentaPage() {
  return (
    <main className="bg-gray-50 px-5 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-md">

        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
            Mi cuenta
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Gestiona tu donación
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-500 sm:text-base">
            Escribe el correo con el que donaste. Te enviaremos un enlace para
            actualizar tu tarjeta, cancelar tu donación mensual o ver tu historial.
          </p>
        </div>

        <CuentaForm />

        <p className="mt-6 text-center text-xs text-gray-400">
          ¿Aún no donas?{" "}
          <a href="/donar" className="font-semibold text-brand-blue hover:underline">
            Hacer mi primera donación →
          </a>
        </p>
      </div>
    </main>
  );
}
