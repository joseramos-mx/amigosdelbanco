import Link from "next/link";

const PAGES = [
  { href: "/", label: "Inicio" },
  { href: "/#mision", label: "Quiénes somos" },
  { href: "/progreso", label: "Progreso de obra" },
  { href: "/donantes", label: "Donantes" },
  { href: "/#galeria", label: "Galería" },
  { href: "/donar", label: "Donar" },
  { href: "/cuenta", label: "Mi cuenta" },
  {
    href: "https://youtu.be/ALJQvdfJAWY?si=HZpoxGHCLyv6ysqi",
    label: "Historia",
    external: true,
  },
  {
    href: "https://forms.gle/8V4bNPLLgQTPyEQt7",
    label: "Voluntarios",
    external: true,
  },
  { href: "/privacidad", label: "Aviso de privacidad" },
  { href: "/terminos", label: "Términos de uso" },
];

// Pendiente: sustituir por las ligas reales (el footer del sitio también las
// tiene en "#").
const SOCIALS = [
  {
    label: "Facebook",
    href: "#",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    label: "Instagram",
    path: "",
    href: "#",
  },
  {
    label: "WhatsApp",
    href: "#",
    path: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.5.05-.98.24-3.3-.7-2.77-1.12-4.53-3.95-4.67-4.13-.13-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34.18 0 .36 0 .51.01.17.01.39-.6.6.46.23.55.77 1.9.84 2.04.07.14.11.3.02.48-.09.19-.14.3-.27.47-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.64-.17 1.32z",
  },
];

export default function RunFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-12">
      <div className="border-t border-white/10 pt-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* ── Todas las páginas del sitio ─────────────────────────── */}
          <nav aria-label="Páginas del sitio">
            <ul className="flex flex-wrap gap-x-5 gap-y-3">
              {PAGES.map((page) => (
                <li key={page.href}>
                  {page.external ? (
                    <a
                      href={page.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-geist-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-run-amber sm:text-[11px]"
                    >
                      {page.label}
                    </a>
                  ) : (
                    <Link
                      href={page.href}
                      className="font-geist-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-run-amber sm:text-[11px]"
                    >
                      {page.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Redes sociales ──────────────────────────────────────── */}
          <ul className="flex shrink-0 gap-3">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-run-amber hover:text-run-amber"
                >
                  {social.label === "Instagram" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d={social.path} />
                    </svg>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
          © {year} Banco de Alimentos de Durango A.C.
        </p>
      </div>
    </footer>
  );
}
