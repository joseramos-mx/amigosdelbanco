/**
 * Trazo de la ruta (circuito 3K y 6K).
 *
 * Circuito urbano con salida y meta en la Antigua Estación de Ferrocarril
 * (24.036361, -104.675367).
 * Tramos largos: Boulevard Felipe Pescador y Boulevard Estación Central.
 * Tramos cortos conectores: Calle Laureano Roncal y Av. Dolores del Río.
 */

/** [longitud, latitud] — el orden de GeoJSON, no el de Google Maps. */
export type Punto = [number, number];

export const PUNTOS: Punto[] = [
  [-104.67537, 24.03636],
  [-104.67569, 24.03476],
  [-104.67527, 24.03452],
  [-104.65995, 24.03562],
  [-104.66044, 24.03676],
  [-104.66055, 24.03733],
  [-104.66923, 24.03657],
  [-104.67181, 24.03673],
  [-104.67567, 24.03631],
  [-104.68095, 24.03604],
  [-104.68009, 24.03481],
  [-104.67987, 24.03363],
  [-104.67574, 24.03407],
  [-104.67550, 24.03436],
  [-104.67537, 24.03636],
];

export const SALIDA: Punto = [-104.675367, 24.036361];
export const META: Punto = [-104.675367, 24.036361];

/** El trazo ya es el recorrido real por calles, no una recta entre extremos. */
export const PROVISIONAL = false;

/** Kilómetros medidos sobre el circuito oficial. */
export const DISTANCIA_KM = "3K y 6K";

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
export const TIEMPO_LIMITE: string | null = "1h";

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
