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
  /**
   * Qué se toca ahí. Todas rondan los 200 caracteres a propósito: la
   * tarjeta es de alto fijo y con textos de largo distinto unas quedan
   * apretadas y otras medio vacías.
   */
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
      "Electrónica de principio a fin, sin pausa entre canción y canción. Es la zona de quien llegó a bailar y no piensa sentarse en toda la tarde: se entra sabiendo que se sale hasta que apaguen las bocinas, y hasta ahora nadie ha salido antes.",
    // Sin artistas de referencia, así que el texto va más largo: es el único
    // que no lleva el renglón de "si te gusta…" y sin eso la tarjeta se veía
    // más vacía que las otras tres.
    artistas: [],
    ancho: "74%",
    playlist: null,
  },
  {
    slug: "ska",
    nombre: "Ska",
    descripcion:
      "Ska del que se brinca, no del que se oye sentado. Metales, coros a todo pulmón y gente que no se conoce entre sí cantando exactamente lo mismo, sin ponerse de acuerdo.",
    artistas: ["Panteón Rococó"],
    ancho: "58%",
    playlist: null,
  },
  {
    slug: "oldies",
    nombre: "Oldies",
    descripcion:
      "Baladas y pop en español de las que todo mundo se sabe aunque jure que no. Para cantar con los ojos cerrados y sin pena, que para eso vino.",
    artistas: ["Luis Miguel", "Flans", "Mijares", "Timbiriche"],
    ancho: "59%",
    playlist: null,
  },
  {
    slug: "ranchero",
    nombre: "Ranchero",
    descripcion:
      "Norteño, banda y ranchero para cantar hasta quedar ronco. La zona donde nadie pregunta si te sabes la letra, porque se da por hecho que sí.",
    artistas: ["Intocable", "Banda MS", "El Recodo"],
    ancho: "80%",
    playlist: null,
  },
];
