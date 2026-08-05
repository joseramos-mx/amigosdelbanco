"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapaLibre } from "maplibre-gl";
// Los estilos van estáticos: importar el CSS con import() en tiempo de
// ejecución hace que el bundler sirva HTML en lugar del archivo. Pesa poco y
// no arrastra el JS de la librería, que sigue siendo diferido.
import "maplibre-gl/dist/maplibre-gl.css";
import { META, PUNTOS, SALIDA, encuadre, type Punto } from "@/lib/run/ruta";

/**
 * Mapa de la ruta.
 *
 * MapLibre pesa unos 200 KB, así que no se carga con la página: se importa
 * cuando la sección está por entrar en pantalla. El bento de arriba aparece
 * igual de rápido y quien nunca baja no paga nada.
 *
 * Dos decisiones que salieron de pelearse con esto:
 *
 * · Teselas **raster** de Carto, con el estilo declarado aquí mismo. El
 *   estilo vectorial arrastra sprites, glifos y otra petición de TileJSON, y
 *   basta con que una se atore para que el mapa se quede cargando sin dar
 *   error. Para una ruta que se mira una vez, la nitidez extra no compensa.
 *
 * · El trazo va en un **SVG encima del lienzo**, no como fuente GeoJSON.
 *   MapLibre parsea el GeoJSON en un web worker y el bundler no resuelve ese
 *   chunk: la petición devuelve HTML y el mapa nunca termina de cargar, sin
 *   lanzar error. Proyectando los puntos a píxeles se evita el worker por
 *   completo, y de paso el trazo se puede animar o puntear con CSS.
 */

const AMBAR = "#e9a62d";

const ESTILO = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: "base", type: "raster" as const, source: "carto" }],
};

export default function MapaRuta() {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapaLibre | null>(null);
  const observadorRef = useRef<ResizeObserver | null>(null);
  const [visible, setVisible] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(false);
  /** El trazo en coordenadas de pantalla, recalculado en cada movimiento. */
  const [trazo, setTrazo] = useState("");

  // Se enciende poco antes de llegar, para que el mapa ya esté cuando la
  // sección quede a la vista.
  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  const proyectar = useCallback((mapa: MapaLibre) => {
    setTrazo(
      PUNTOS.map((p: Punto) => {
        const { x, y } = mapa.project(p);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" "),
    );
  }, []);

  useEffect(() => {
    if (!visible || mapaRef.current || !contenedor.current) return;
    let cancelado = false;
    let temporizador = 0;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelado || !contenedor.current) return;

        const { limites } = encuadre(PUNTOS);
        const mapa = new maplibre.Map({
          container: contenedor.current,
          style: ESTILO,
          bounds: limites,
          fitBoundsOptions: { padding: 80 },
          attributionControl: { compact: true },
          // La ruta se ve completa de un vistazo; girarla no aporta y en
          // celular provoca giros accidentales al hacer zoom con dos dedos.
          dragRotate: false,
        });
        mapa.touchZoomRotate.disableRotation();
        mapa.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        mapaRef.current = mapa;

        const actualizar = () => {
          if (!cancelado) proyectar(mapa);
        };
        mapa.on("move", actualizar);
        mapa.on("resize", actualizar);

        // El encuadre depende del tamaño del contenedor, y ese tamaño puede
        // cambiar después de crear el mapa: al girar el teléfono, al abrir la
        // sección con la página aún acomodándose, o al cruzar el breakpoint
        // donde la altura pasa de 420 a 520. Sin esto, la ruta queda como una
        // rayita en medio de un mapa demasiado abierto.
        const observador = new ResizeObserver(() => {
          if (cancelado) return;
          mapa.resize();
          mapa.fitBounds(limites, { padding: 80, animate: false });
        });
        observador.observe(contenedor.current);
        observadorRef.current = observador;

        mapa.on("load", () => {
          if (cancelado) return;

          for (const [punto, etiqueta] of [
            [SALIDA, "Salida"],
            [META, "Meta"],
          ] as const) {
            const nodo = document.createElement("div");
            nodo.className =
              "flex items-center gap-1.5 rounded-full bg-run-amber px-3 py-1.5 " +
              "font-geist-mono text-[10px] uppercase tracking-[0.16em] text-black shadow-lg";
            nodo.textContent = etiqueta;
            new maplibre.Marker({ element: nodo, anchor: "bottom" })
              .setLngLat(punto)
              .addTo(mapa);
          }

          // El ajuste va en el cuadro siguiente, no aquí: "load" puede
          // dispararse antes de que el navegador termine de acomodar la
          // sección, y entonces el encuadre se calcula con un contenedor que
          // todavía no tiene su tamaño final — la ruta acaba viéndose como
          // una rayita en medio de un mapa demasiado abierto.
          const encuadrar = () => {
            if (cancelado) return;
            mapa.resize();
            mapa.fitBounds(limites, { padding: 60, animate: false });
            actualizar();
          };

          requestAnimationFrame(() => {
            encuadrar();
            setListo(true);
          });

          // Segundo intento tardío: entre las fuentes que terminan de cargar,
          // las imágenes de arriba que empujan el diseño y el observador de
          // tamaño, el contenedor puede seguir moviéndose después del primer
          // cuadro. Reencuadrar es idempotente, así que no cuesta nada.
          temporizador = window.setTimeout(encuadrar, 400);
        });

        mapa.on("error", () => setError(true));
      } catch {
        setError(true);
      }
    })();

    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
      observadorRef.current?.disconnect();
      observadorRef.current = null;
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, [visible, proyectar]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[20px] border border-white/10 bg-run-card lg:h-[520px]">
      {/* El posicionamiento va en línea, no en clases de Tailwind, y no es
          capricho: MapLibre le pone al contenedor su clase `.maplibregl-map`,
          que trae `position: relative` sin capa. Las utilidades de Tailwind
          viven en `@layer utilities`, y lo no-capado le gana a lo capado, así
          que `absolute` se pierde. El div se queda sin altura propia, MapLibre
          lee `clientHeight === 0` y cae a su valor por defecto de 300 px: mapa
          recortado y ruta encuadrada como si el hueco midiera 300. Un estilo
          en línea le gana a cualquier hoja. */}
      <div ref={contenedor} style={{ position: "absolute", inset: 0 }} />

      {/* El trazo va encima del lienzo y deja pasar el ratón, para que el
          mapa se siga pudiendo arrastrar por debajo. */}
      {trazo && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <polyline
            points={trazo}
            fill="none"
            stroke={AMBAR}
            strokeWidth={14}
            strokeOpacity={0.22}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={trazo}
            fill="none"
            stroke={AMBAR}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {!listo && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            {visible ? "Cargando el mapa…" : ""}
          </p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-white/50">
            No pudimos cargar el mapa. La salida es en la Antigua Estación de
            Ferrocarril, Durango.
          </p>
        </div>
      )}
    </div>
  );
}
