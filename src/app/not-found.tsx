import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Vive en la raíz (no en `(site)`) porque Next renderiza el 404 global con el
// layout raíz — sin esto, la página perdería navbar y footer.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-blue">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            No encontramos esta página
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            Puede que la liga haya cambiado o que la página ya no exista.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-brand-yellow px-7 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-base"
            >
              Ir al inicio
            </Link>
            <Link
              href="/donar"
              className="rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 sm:text-base"
            >
              Donar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
