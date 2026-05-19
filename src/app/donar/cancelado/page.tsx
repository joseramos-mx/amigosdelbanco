import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donación cancelada",
};

export default function CanceladoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 pt-28 pb-20 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
          Donación cancelada
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
          No completaste el pago — no se realizó ningún cargo. Cuando estés listo,
          puedes intentarlo de nuevo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/donar"
            className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-base"
          >
            Volver a intentar
          </Link>
          <Link
            href="/"
            className="rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 sm:text-base"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
