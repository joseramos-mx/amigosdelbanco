/**
 * Los moods del festival.
 *
 * Al llegar al Banco de Alimentos hay varias zonas y cada una toca lo suyo.
 * Esto es lo que las describe para que cada quien sepa a cuál irse.
 *
 * El nombre de cada género es un SVG con su propio color y su propia
 * proporción, no texto: son letreros dibujados, no una tipografía que
 * tengamos. Por eso `ancho` viene aquí — cada letrero necesita ocupar una
 * fracción distinta de la tarjeta para que todos se vean del mismo tamaño
 * óptico, y eso no se puede sacar de una sola regla de CSS.
 */

export type Mood = {
  /** Nombre del par de archivos en `public/run/moods/`: .jpg y .svg. */
  slug: string;
  /** Para el texto alternativo del letrero. */
  nombre: string;
  /** Qué se toca ahí. */
  descripcion: string;
  /** Referencias para ubicarse. Vacío mientras no las confirmen. */
  artistas: string[];
  /**
   * Cuánto ocupa el letrero a lo ancho. Se mide contra la caja interior de
   * la foto, la que ya descontó el margen lateral — no contra la tarjeta
   * completa.
   */
  ancho: string;
  /**
   * Liga a la playlist de muestra.
   *
   * En null no se dibuja el botón de reproducir. Un botón que no hace nada
   * en una página publicada es peor que no tenerlo: la gente le pica, no
   * pasa nada, y de ahí en adelante desconfía de lo demás.
   */
  playlist: string | null;
};

export const MOODS: Mood[] = [
  {
    slug: "rave",
    nombre: "Rave",
    descripcion:
      "Electrónica de principio a fin. Para quien llega a bailar y no piensa sentarse en toda la tarde.",
    artistas: [],
    ancho: "74%",
    playlist: null,
  },
  {
    slug: "ska",
    nombre: "Ska",
    descripcion:
      "Ska y brincos, con los coros a todo pulmón.",
    artistas: ["Panteón Rococó"],
    ancho: "58%",
    playlist: null,
  },
  {
    slug: "oldies",
    nombre: "Oldies",
    descripcion:
      "Baladas y pop en español, de las que todo mundo se sabe aunque jure que no.",
    artistas: ["Luis Miguel", "Flans", "Mijares", "Timbiriche"],
    ancho: "59%",
    playlist: null,
  },
  {
    slug: "ranchero",
    nombre: "Ranchero",
    descripcion:
      "Norteño, banda y ranchero para cantar hasta quedar ronco.",
    artistas: ["Intocable", "Banda MS", "El Recodo"],
    ancho: "80%",
    playlist: null,
  },
];
