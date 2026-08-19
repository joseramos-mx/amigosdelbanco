import Link from "next/link";

/**
 * Pestaña fija al costado derecho con la llamada a comprar.
 *
 * Duplica a propósito el botón de la barra del pie: al bajar por la página la
 * barra se lee como parte del mueble y se deja de ver, mientras que la
 * pestaña queda a media altura, donde cae la mirada.
 *
 * De 768 para abajo no se dibuja. En un teléfono se le monta al contenido —no
 * hay margen lateral que la aguante sin tapar texto— y ahí el botón de la
 * barra ya está a un pulgar de distancia.
 */
export default function BotonLateral({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      // z-40 y no z-50: si se cruzan, la que manda es la barra del pie.
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 rounded-l-xl bg-run-amber py-6 pr-2 pl-2.5 text-black shadow-lg transition-[padding] hover:pl-4 md:flex"
    >
      <span className="font-geist-mono text-[11px] uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
        {children}
      </span>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-black/70" aria-hidden>
        <path d="M12 16 5 9h14z" />
      </svg>
    </Link>
  );
}
