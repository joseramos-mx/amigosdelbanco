/**
 * Pestaña fija al costado derecho con el aviso de apertura.
 *
 * En su versión abierta era un botón "Comprar boleto" que duplicaba a la
 * píldora del pie: al bajar por la página el pie se lee como parte del
 * mueble y se deja de ver, mientras que la pestaña queda a media altura,
 * donde cae la mirada. Ese mismo criterio aplica ahora que está bloqueada.
 *
 * De 768 para abajo no se dibuja. En un teléfono se le monta al contenido
 * —no hay margen lateral que la aguante sin tapar texto— y ahí la píldora
 * del pie ya está a un pulgar de distancia.
 *
 * Muestra "Abre 19 AGO" en vez de una cuenta viva: la tipografía vertical
 * hace ilegibles los `:` de un `HH:MM:SS` que además vibraría cada segundo
 * en el rabillo del ojo.
 */
export default function BotonLateral() {
  return (
    // z-40 y no z-50: si se cruzan, la que manda es la barra del pie.
    <div
      aria-hidden
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 rounded-l-xl bg-white/10 py-6 pr-2 pl-2.5 text-white/75 shadow-lg ring-1 ring-inset ring-white/15 backdrop-blur-md md:flex"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current opacity-75" aria-hidden>
        <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
      </svg>
      <span className="font-geist-mono text-[11px] uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
        Abre 19 AGO
      </span>
    </div>
  );
}
