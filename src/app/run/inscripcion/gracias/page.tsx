import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Inscripción recibida — Social Run 2026" },
  robots: { index: false, follow: false },
};

/**
 * Página de retorno del checkout.
 *
 * No confirma nada a propósito: el estado del pago lo define el webhook. Con
 * OXXO o SPEI la persona llega aquí *antes* de pagar, así que el texto habla
 * de "recibimos tu solicitud", nunca de "pago confirmado".
 */
export default function GraciasPage() {
  return (
    <main className="flex min-h-svh items-center px-4 py-16 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-xl">
        <h1 className="font-schabo text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-[0.9]">
          Ya casi <span className="text-run-amber">estás dentro</span>
        </h1>

        <p className="mt-6 leading-relaxed text-white/70">
          Recibimos tu solicitud. Te mandamos un correo con el folio y, si elegiste
          OXXO o transferencia, con la referencia para pagar.
        </p>

        <ul className="mt-8 space-y-4 text-sm leading-relaxed text-white/55">
          <li>
            <strong className="text-white">Tu lugar queda apartado</strong> mientras la
            referencia siga vigente. Si vence sin pago, se libera para alguien más.
          </li>
          <li>
            <strong className="text-white">El pago en tienda tarda</strong> en
            reflejarse: puede pasar algunas horas antes de que te llegue la
            confirmación.
          </li>
          <li>
            <strong className="text-white">Después del pago</strong> te enviamos la liga
            para llenar los datos de cada corredor: nombre, talla, contacto de
            emergencia y la carta responsiva.
          </li>
        </ul>

        <Link
          href="/run"
          className="mt-10 inline-block rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
        >
          Volver al evento
        </Link>
      </div>
    </main>
  );
}
