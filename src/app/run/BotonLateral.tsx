import Link from "next/link";

/**
 * Pestaña fija al costado derecho con la llamada a comprar.
 *
 * Duplica a propósito el botón de la barra del pie: al bajar por la página la
 * barra se lee como parte del mueble y se deja de ver, mientras que la
 * pestaña queda a media altura, donde cae la mirada.
 *
 * En celular también se dibuja, y ahí sí se le monta al contenido: no hay
 * margen lateral que la aguante sin tapar nada. Se compensa encogiéndola
 * —menos relleno, letra más chica, sin la flecha— para que el mordisco sea
 * de unos 26 píxeles en vez de 38, y se deja pegada al borde en lugar de
 * quitarla, que es lo que se pidió.
 *
 * La flecha se va de la versión angosta porque a ese tamaño no se distingue
 * y solo alarga la pestaña hacia abajo, que es por donde compite con el
 * contenido.
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
      className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2 rounded-l-xl bg-run-amber py-4 pr-1.5 pl-2 text-black shadow-lg transition-[padding] hover:pl-4 md:gap-2.5 md:py-6 md:pr-2 md:pl-2.5"
    >
      <span className="font-geist-mono text-[10px] uppercase tracking-[0.14em] [writing-mode:vertical-rl] md:text-[11px] md:tracking-[0.18em]">
        {children}
      </span>
      <svg
        viewBox="0 0 24 24"
        className="hidden h-3.5 w-3.5 fill-black/70 md:block"
        aria-hidden
      >
        <path d="M12 16 5 9h14z" />
      </svg>
    </Link>
  );
}
