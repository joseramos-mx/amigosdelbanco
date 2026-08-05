/**
 * Trazo de la ruta.
 *
 * Sale del GPX de la organización (`generous-generation/ruta/`): 172 puntos
 * de traza, simplificados a 20 con Douglas-Peucker a 6 metros de tolerancia.
 * El trazo dibujado difiere del real en 5 metros —invisible a cualquier
 * zoom— y pesa 88% menos.
 *
 * Para cambiarlo, vuelve a exportar el GPX y repite ese mismo proceso. Dos
 * cuidados: lee solo los `<trkpt>` (los `<wpt>` del final son los alfileres
 * de salida y meta, y colarlos duplica el recorrido en el cálculo de
 * distancia), y recuerda que las coordenadas van en [longitud, latitud], al
 * revés de como se leen en Google Maps.
 */

/** [longitud, latitud] — el orden de GeoJSON, no el de Google Maps. */
export type Punto = [number, number];

export const PUNTOS: Punto[] = [
  [-104.67253, 24.03658], [-104.67166, 24.03664], [-104.66936, 24.03646],
  [-104.66318, 24.03692], [-104.66026, 24.03734], [-104.65750, 24.03759],
  [-104.65796, 24.04069], [-104.65840, 24.04608], [-104.65836, 24.04708],
  [-104.65603, 24.06024], [-104.65493, 24.06607], [-104.65419, 24.06878],
  [-104.65419, 24.06929], [-104.65430, 24.06960], [-104.65460, 24.06998],
  [-104.65738, 24.07181], [-104.65858, 24.07024], [-104.66208, 24.07175],
  [-104.66260, 24.07165], [-104.66376, 24.07099],
];

export const SALIDA: Punto = PUNTOS[0];
export const META: Punto = PUNTOS[PUNTOS.length - 1];

/** El trazo ya es el recorrido real por calles, no una recta entre extremos. */
export const PROVISIONAL = false;

/** Kilómetros medidos sobre el trazo del GPX. */
export const DISTANCIA_KM = 6.3;

/**
 * Desnivel acumulado, en metros.
 *
 * El GPX que mandaron no trae etiquetas `<ele>`, así que esto no se puede
 * medir del trazo: lo tiene que dar la organización o hay que volver a
 * exportar la ruta con altimetría. Mientras siga en null, la ficha muestra un
 * guion en lugar de un número inventado.
 */
export const DESNIVEL_M: number | null = null;

/**
 * Tiempo límite para cerrar la meta, ya con formato ("1h 30min").
 *
 * No se deduce de nada: es una decisión de la organización, y de ella depende
 * a qué hora se libera la vialidad. Igual que el desnivel, en null se muestra
 * un guion.
 */
export const TIEMPO_LIMITE: string | null = null;

/** Centro y acercamiento iniciales del mapa, calculados del trazo. */
export function encuadre(puntos: Punto[]): { centro: Punto; limites: [Punto, Punto] } {
  const lons = puntos.map((p) => p[0]);
  const lats = puntos.map((p) => p[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  return {
    centro: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
    limites: [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
  };
}

/** Para el botón de "cómo llegar": abre la salida en Google Maps. */
export const LIGA_GOOGLE_MAPS = `https://www.google.com/maps/dir/?api=1&destination=${SALIDA[1]},${SALIDA[0]}`;
