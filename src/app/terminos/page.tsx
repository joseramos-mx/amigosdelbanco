import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Términos de Uso — Banco de Alimentos",
  description: "Términos y condiciones de uso del sitio del Banco de Alimentos de Durango A.C.",
};

const ORG_NAME = "Banco de Alimentos de Durango A.C.";
const CONTACT_EMAIL = "informacion@bancodealimentosdurango.org";
const LAST_UPDATED = "Mayo 2026";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-amber-50 via-white to-gray-50 px-5 pt-28 pb-20 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={16} weight="bold" />
          Volver al inicio
        </Link>

        <header className="mb-10 sm:mb-12">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
            <FileText size={14} weight="fill" />
            Términos de Uso
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Reglas para usar<br className="hidden sm:block" /> este sitio
          </h1>
          <p className="mt-3 text-sm text-gray-500">Última actualización: {LAST_UPDATED}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed text-gray-700 sm:text-base">

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar el sitio web de <strong>{ORG_NAME}</strong>
              {" "}(en adelante, &quot;el Sitio&quot;) aceptas estos Términos de
              Uso en su totalidad. Si no estás de acuerdo con alguna parte,
              te pedimos no utilizar el Sitio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              2. Objeto del Sitio
            </h2>
            <p>
              El Sitio tiene como finalidad informar sobre las actividades del
              Banco de Alimentos de Durango, recibir donaciones para apoyar
              dichas actividades y permitir el registro de voluntarios. La
              información mostrada (estadísticas, leaderboard de donantes,
              avance de obra, etc.) tiene carácter informativo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              3. Donaciones
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Las donaciones son procesadas por <strong>Stripe Payments
                México</strong>. El Banco no tiene acceso a los datos de tu
                tarjeta ni los almacena.
              </li>
              <li>
                Las donaciones mensuales se cobran automáticamente cada mes con
                el método de pago registrado, hasta que canceles la suscripción
                desde{" "}
                <Link href="/cuenta" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                  Mi cuenta
                </Link>{" "}
                o nos contactes directamente.
              </li>
              <li>
                Las donaciones realizadas mediante OXXO o transferencia SPEI
                tienen carácter de pago único y se confirman dentro de los días
                hábiles posteriores al voucher.
              </li>
              <li>
                Las donaciones son voluntarias y, salvo error comprobable o
                cargo no autorizado, no son reembolsables.
              </li>
              <li>
                En caso de cargo duplicado o error, escríbenos a{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                para resolverlo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              4. Lista pública de donantes
            </h2>
            <p>
              Si elegiste mostrar tu nombre en la lista pública de donantes
              durante el proceso de donación, este aparecerá junto con el monto
              total acumulado de tus aportaciones. Puedes solicitar su
              eliminación en cualquier momento escribiendo a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              5. Uso aceptable
            </h2>
            <p className="mb-3">
              Al utilizar el Sitio te comprometes a:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>No realizar acciones que afecten el funcionamiento del Sitio
                o de los sistemas de terceros (Stripe, proveedores de email)</li>
              <li>No intentar acceder sin autorización a áreas restringidas</li>
              <li>No proporcionar información falsa, suplantar identidad o
                utilizar medios de pago de los que no seas titular</li>
              <li>Respetar la propiedad intelectual del Sitio y de sus
                contenidos</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              6. Propiedad intelectual
            </h2>
            <p>
              Los textos, imágenes, logotipos, ilustraciones y demás contenidos
              del Sitio son propiedad del Banco de Alimentos de Durango o de sus
              respectivos titulares. Queda prohibida su reproducción total o
              parcial sin autorización por escrito.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              7. Enlaces a terceros
            </h2>
            <p>
              El Sitio puede contener enlaces a sitios externos (formularios de
              voluntariado, redes sociales, video de YouTube, Stripe Customer
              Portal). El Banco no es responsable del contenido, políticas o
              prácticas de dichos sitios.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              8. Limitación de responsabilidad
            </h2>
            <p>
              El Sitio se proporciona &quot;tal cual&quot;. Si bien procuramos
              mantener la información actualizada y el servicio disponible, no
              garantizamos la ausencia de interrupciones, errores técnicos o
              imprecisiones en los datos mostrados (estadísticas, avance de
              obra, etc.).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              9. Modificaciones
            </h2>
            <p>
              Estos Términos pueden actualizarse en cualquier momento. La
              versión vigente estará siempre disponible en esta página, con la
              fecha de última actualización al inicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              10. Ley aplicable y jurisdicción
            </h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos
              Mexicanos. Cualquier controversia se someterá a los tribunales
              competentes del estado de Durango.
            </p>
          </section>

          <section className="rounded-2xl bg-brand-yellow/15 px-5 py-5 text-sm sm:px-6">
            <h2 className="mb-2 text-base font-bold text-amber-900 sm:text-lg">
              ¿Dudas sobre estos términos?
            </h2>
            <p className="text-amber-900/80">
              Contáctanos en{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-amber-900 underline-offset-2 hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

        </article>
      </div>
    </main>
  );
}
