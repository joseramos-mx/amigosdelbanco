import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Banco de Alimentos",
  description: "Aviso de Privacidad del Banco de Alimentos de Durango A.C.",
};

const ORG_NAME = "Banco de Alimentos de Durango A.C.";
const CONTACT_EMAIL = "informacion@bancodealimentosdurango.org";
const ADDRESS = "Durango, Dgo., México";
const LAST_UPDATED = "Mayo 2026";

export default function PrivacidadPage() {
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
            <ShieldCheck size={14} weight="fill" />
            Aviso de Privacidad
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Cómo protegemos<br className="hidden sm:block" /> tus datos
          </h1>
          <p className="mt-3 text-sm text-gray-500">Última actualización: {LAST_UPDATED}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed text-gray-700 sm:text-base">

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              1. Identidad del responsable
            </h2>
            <p>
              <strong>{ORG_NAME}</strong> (en adelante, &quot;el Banco&quot;),
              con domicilio en {ADDRESS}, es responsable del tratamiento de
              sus datos personales conforme a la <em>Ley Federal de Protección
              de Datos Personales en Posesión de los Particulares</em> (LFPDPPP)
              y su Reglamento.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              2. ¿Qué datos personales recabamos?
            </h2>
            <p className="mb-3">
              Cuando realizas una donación o te registras como voluntario,
              recabamos los siguientes datos:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Información de pago (procesada de forma segura por Stripe — el
                Banco no almacena ni tiene acceso a los datos de tu tarjeta)</li>
              <li>Datos fiscales (RFC, razón social) si solicitas recibo
                deducible de impuestos</li>
              <li>Teléfono de contacto, si decides proporcionarlo</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              3. ¿Para qué utilizamos tus datos?
            </h2>
            <p className="mb-3">Finalidades primarias (necesarias):</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Procesar tu donación a través de nuestros procesadores de pago</li>
              <li>Enviarte el recibo correspondiente al correo electrónico</li>
              <li>Emitir el comprobante fiscal (CFDI) cuando corresponda</li>
              <li>Gestionar donaciones recurrentes (mensuales)</li>
              <li>Mostrar tu nombre en la lista pública de donantes, solo si así
                lo autorizaste expresamente</li>
              <li>Dar respuesta a tus consultas y solicitudes</li>
            </ul>
            <p className="mt-4 mb-3">Finalidades secundarias (opcionales):</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Informarte sobre eventos, campañas y noticias del Banco</li>
              <li>Estadísticas internas y reportes de impacto</li>
            </ul>
            <p className="mt-4">
              Si no deseas que tus datos sean utilizados para las finalidades
              secundarias, puedes manifestarlo escribiendo a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              4. ¿Con quién compartimos tu información?
            </h2>
            <p className="mb-3">
              Tus datos personales pueden ser transferidos a los siguientes
              terceros únicamente con los fines descritos:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Stripe Payments México</strong> — para procesar pagos
                y donaciones recurrentes</li>
              <li><strong>Autoridades fiscales (SAT)</strong> — para emisión de
                CFDI cuando corresponda</li>
              <li><strong>Proveedores de servicios tecnológicos</strong> (correo,
                hosting) bajo acuerdos de confidencialidad</li>
            </ul>
            <p className="mt-3">
              No vendemos, alquilamos ni cedemos tus datos personales a terceros
              con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              5. Derechos ARCO
            </h2>
            <p>
              Tienes derecho a <strong>Acceder</strong> a tus datos personales,
              <strong> Rectificar</strong>los si son inexactos,{" "}
              <strong>Cancelar</strong>los cuando consideres que no son
              necesarios para alguna de las finalidades, u{" "}
              <strong>Oponerte</strong> a su tratamiento para fines específicos.
              Para ejercer cualquiera de estos derechos envía un correo a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              indicando tu nombre, copia de identificación oficial y la
              solicitud específica. Te responderemos en un plazo no mayor a 20
              días hábiles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              6. Revocación del consentimiento
            </h2>
            <p>
              Puedes revocar el consentimiento que nos hayas otorgado para el
              tratamiento de tus datos en cualquier momento, dirigiendo tu
              solicitud al correo de contacto. Si tienes una donación mensual
              activa, también puedes cancelarla en{" "}
              <Link href="/cuenta" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                Mi cuenta
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              7. Cookies y tecnologías similares
            </h2>
            <p>
              Nuestro sitio utiliza cookies y tecnologías estrictamente
              necesarias para el funcionamiento del sitio y el procesamiento
              seguro de pagos (Stripe). No usamos cookies de publicidad
              comportamental. Puedes desactivar las cookies desde la
              configuración de tu navegador, aunque eso puede afectar la
              experiencia del sitio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
              8. Cambios al Aviso
            </h2>
            <p>
              Este aviso de privacidad puede actualizarse cuando sea necesario.
              La versión más reciente estará siempre disponible en esta misma
              página. La fecha de última actualización aparece en la parte
              superior. Te recomendamos revisarlo periódicamente.
            </p>
          </section>

          <section className="rounded-2xl bg-brand-yellow/15 px-5 py-5 text-sm sm:px-6">
            <h2 className="mb-2 text-base font-bold text-amber-900 sm:text-lg">
              ¿Tienes preguntas sobre tus datos?
            </h2>
            <p className="text-amber-900/80">
              Escríbenos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-amber-900 underline-offset-2 hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              y con gusto te atenderemos.
            </p>
          </section>

        </article>
      </div>
    </main>
  );
}
