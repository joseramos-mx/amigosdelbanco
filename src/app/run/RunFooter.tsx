import Link from "next/link";
import Reveal from "./Reveal";
import GiantWordmark from "./GiantWordmark";

const GROUPS = [
  {
    label: "Sitio",
    links: [
      { href: "/", label: "Inicio" },
      { href: "/#mision", label: "Quiénes somos" },
      { href: "/#galeria", label: "Galería" },
      {
        href: "https://youtu.be/ALJQvdfJAWY?si=HZpoxGHCLyv6ysqi",
        label: "Nuestra historia",
        external: true,
      },
    ],
  },
  {
    label: "Apoyar",
    links: [
      { href: "/donar", label: "Donar ahora" },
      { href: "/donantes", label: "Donantes" },
      { href: "/cuenta", label: "Mi cuenta" },
      {
        href: "https://forms.gle/8V4bNPLLgQTPyEQt7",
        label: "Ser voluntario",
        external: true,
      },
    ],
  },
  {
    label: "Proyecto",
    links: [
      { href: "/progreso", label: "Progreso de obra" },
      { href: "/run", label: "Social Run 2026" },
      { href: "/run/inscripcion", label: "Comprar acceso" },
    ],
  },
  {
    label: "Redes",
    // Pendiente: sustituir por los perfiles reales (el footer del sitio
    // también los tiene en "#").
    links: [
      { href: "#", label: "Facebook", external: true },
      { href: "#", label: "Instagram", external: true },
      { href: "#", label: "WhatsApp", external: true },
    ],
  },
];

const LINK =
  "text-[15px] text-white/85 transition-colors hover:text-run-amber";

export default function RunFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden px-4 pt-20 sm:px-6 lg:px-12 lg:pt-28">
      <div className="relative mx-auto max-w-[1500px]">
        <Link href="/" aria-label="Banco de Alimentos de Durango">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Banco de Alimentos de Durango"
            className="h-11 w-auto transition-opacity hover:opacity-70"
          />
        </Link>

        {/* ── Columnas + bloque de acceso ───────────────────────────── */}
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-[repeat(4,minmax(0,1fr))_1.25fr] lg:gap-8">
          {GROUPS.map((group, i) => (
            <Reveal key={group.label} delay={i * 70}>
              <p className="text-[15px] text-white/35">{group.label}</p>
              <ul className="mt-6 space-y-4">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={LINK}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          <Reveal delay={280} className="sm:col-span-2 lg:col-span-1">
            <p className="text-[15px] text-white/85">
              Asegura tu Founding Member Pass
            </p>
            <Link
              href="/run/inscripcion"
              className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 p-1.5 pl-4 transition-colors hover:border-white/25"
            >
              <span className="text-sm text-white/45">Cupo limitado</span>
              <span className="shrink-0 rounded-lg bg-run-amber px-4 py-2.5 text-sm font-medium text-black">
                Comprar
              </span>
            </Link>
          </Reveal>
        </div>

        {/* ── Barra inferior ────────────────────────────────────────── */}
        <Reveal className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-24">
          <p className="text-sm text-white/50">
            © {year} Banco de Alimentos de Durango A.C. — Durango, Dgo., México
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="text-sm text-white/85 transition-colors hover:text-run-amber"
            >
              Aviso de privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-sm text-white/85 transition-colors hover:text-run-amber"
            >
              Términos de uso
            </Link>
          </div>
        </Reveal>
      </div>

      <GiantWordmark />
    </footer>
  );
}
