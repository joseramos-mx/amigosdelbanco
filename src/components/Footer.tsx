import Link from "next/link";

const NAV_GROUPS = [
  {
    label: "Organización",
    links: [
      { href: "/quienes-somos", label: "Quiénes Somos" },
      { href: "/historia",      label: "Historia" },
      { href: "/voluntarios",   label: "Voluntarios" },
      { href: "/galeria",       label: "Galería" },
    ],
  },
  {
    label: "Apoyar",
    links: [
      { href: "/donar",    label: "Donar ahora" },
      { href: "/donantes", label: "Donantes" },
      { href: "/cuenta",   label: "Mi cuenta" },
    ],
  },
];

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 px-5 pt-16 pb-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr]">

          {/* Brand column */}
          <div>
            <img src="/logo.svg" alt="Banco de Alimentos Durango" className="mb-5 w-24 brightness-0 invert" />
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
              Por un Durango sin hambre. Llevamos alimentos a quienes más los necesitan gracias al apoyo de toda nuestra comunidad.
            </p>
            <Link
              href="/donar"
              className="inline-flex rounded-full bg-brand-yellow px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Donar ahora
            </Link>

            {/* Social icons */}
            <div className="mt-8 flex gap-3">
              {/* Facebook */}
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-gray-400 transition-colors hover:bg-brand-yellow hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-gray-400 transition-colors hover:bg-brand-yellow hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="#" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-gray-400 transition-colors hover:bg-brand-yellow hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12.007 2C6.48 2 2.007 6.473 2.007 12c0 1.989.58 3.842 1.58 5.408L2 22l4.734-1.56A9.953 9.953 0 0 0 12.007 22C17.534 22 22 17.527 22 12c0-5.528-4.466-10-9.993-10zm0 18.18a8.18 8.18 0 0 1-4.17-1.138l-.299-.178-3.103 1.022 1.04-3.002-.195-.308A8.154 8.154 0 0 1 3.82 12c0-4.508 3.68-8.18 8.187-8.18 4.508 0 8.18 3.672 8.18 8.18 0 4.508-3.672 8.18-8.18 8.18z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-500">
                {group.label}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-500">
              Contacto
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <LocationIcon />
                <span>Durango, Dgo., México</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MailIcon />
                <a href="mailto:contacto@badurango.org" className="transition-colors hover:text-white break-all">
                  contacto@badurango.org
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <PhoneIcon />
                <a href="tel:+526180000000" className="transition-colors hover:text-white">
                  +52 618 000 0000
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────── */}
        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-8 sm:flex-row">
          <p className="text-xs text-gray-600">
            © 2025 Banco de Alimentos de Durango A.C. Todos los derechos reservados.
          </p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="text-xs text-gray-600 transition-colors hover:text-gray-400">
              Aviso de privacidad
            </Link>
            <Link href="/terminos" className="text-xs text-gray-600 transition-colors hover:text-gray-400">
              Términos de uso
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
