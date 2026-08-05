/**
 * Trazo de la ruta.
 *
 * `PUNTOS` es la línea que se pinta en el mapa, en el orden en que se corre.
 * Hoy solo tiene salida y meta, así que se dibuja recto — por eso
 * `PROVISIONAL` está en true y la sección lo dice sin adornos: enseñar una
 * línea recta como si fuera el recorrido real haría que alguien calcule mal
 * su ritmo.
 *
 * Para poner el trazo definitivo: traza la ruta en Strava o plotaroute,
 * exporta GPX, y pega aquí las coordenadas en formato [longitud, latitud]
 * —así las quiere GeoJSON, al revés de como se leen normalmente—. Luego pon
 * PROVISIONAL en false y ajusta DISTANCIA_KM al dato real del GPX.
 */

/** [longitud, latitud] — el orden de GeoJSON, no el de Google Maps. */
export type Punto = [number, number];

export const SALIDA: Punto = [-104.672639, 24.036528];
export const META: Punto = [-104.66218933635436, 24.071367063350575];

export const PUNTOS: Punto[] = [SALIDA, META];

export const PROVISIONAL = true;

/** Kilómetros del recorrido real. Con el trazo provisional es la recta. */
export const DISTANCIA_KM = 4.0;

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
