import Link from "next/link";

export const metadata = { robots: { index: false, follow: false } };

export default function NoAutorizadoPage() {
  return (
    <main className="flex min-h-svh items-center px-4 sm:px-6">
      <div className="mx-auto max-w-md">
        <h1 className="font-schabo text-[clamp(2.2rem,7vw,3.5rem)] uppercase leading-[0.9]">
          Pase no válido
        </h1>
        <p className="mt-5 leading-relaxed text-white/60">
          Esta liga venció o no es correcta. Pídele a coordinación que te mande
          una nueva — se generan al momento.
        </p>
        <Link
          href="/run"
          className="mt-8 inline-block rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85"
        >
          Ir al evento
        </Link>
      </div>
    </main>
  );
}
