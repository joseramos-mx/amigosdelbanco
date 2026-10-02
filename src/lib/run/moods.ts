/**
 * Los moods del festival.
 *
 * Al llegar al Banco de Alimentos hay varias zonas y cada una toca lo suyo.
 * Esto es lo que las describe para que cada quien sepa a cuál irse.
 *
 * Cada mood se presenta con la foto de sus artistas y, en la tarjeta de texto,
 * su logo. El nombre del género sale en el encabezado de la tarjeta.
 * Los moods con más de un artista (Electrónica) se muestran como carrusel.
 *
 * Archivos de cada artista, en `public/run/artistas/`:
 *   - foto:  {slug}.jpg
 *   - logo:  {slug}-logo.png  (o .svg; con fondo transparente)
 */

export type Artista = {
  nombre: string;
  /** Foto del artista, ruta dentro de `public/`. */
  foto: string;
  /**
   * Logo del artista, ruta dentro de `public/`. Va en su propio recuadro
   * grande junto a la foto, NO sobre ella: así sirve igual un PNG
   * transparente que un JPG con fondo. Se ajusta solo al recuadro.
   */
  logo: string;
  /**
   * Color del recuadro detrás del logo. Por defecto, blanco. Si el logo es un
   * JPG con fondo de otro color, pon aquí ese mismo color para que no se
   * note el borde; si es claro (texto blanco), pon uno oscuro.
   */
  fondoLogo?: string;
  /**
   * Cómo se acomoda la foto en el recuadro.
   * - "cubrir" (por defecto): llena el recuadro y recorta lo que sobre.
   *   Va bien con fotos horizontales; con una vertical se acerca muchísimo
   *   y solo se ve una franja.
   * - "contener": se ve la foto completa, sin recortar, y los lados se
   *   rellenan con la misma foto desenfocada. Es la opción para retratos
   *   verticales, como los de los DJs.
   */
  ajuste?: "cubrir" | "contener";
  /**
   * Hacia dónde se centra el recorte de la foto (`object-position`). Solo aplica con ajuste "cubrir".
   * La fila es muy horizontal y las fotos suelen ser verticales, así que se
   * recortan mucho: con "center 25%" se prioriza la parte de arriba (caras).
   */
  enfoque?: string;
};

export type Mood = {
  /** Identificador del mood (para la llave de React y anclas). */
  slug: string;
  /** Va en el encabezado de la tarjeta: "Elige tu mood {nombre}". */
  nombre: string;
  /**
   * Qué se toca ahí. Todas rondan los 200 caracteres a propósito: la
   * tarjeta es de alto fijo y con textos de largo distinto unas quedan
   * apretadas y otras medio vacías.
   */
  descripcion: string;
  /** Quiénes tocan ahí. Si hay más de uno, la foto se vuelve carrusel. */
  artistas: Artista[];
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
    slug: "norteno",
    nombre: "Norteño",
    descripcion:
      "Acordeón, bajo sexto y canciones que todo mundo se sabe. Aquí es donde se canta a todo pulmón, abrazado de quien tengas al lado, sin pena de desafinar y con el sombrero bien puesto.",
    artistas: [
      {
        nombre: "Los Palos",
        foto: "/run/artistas/los-palos.jpeg",
        logo: "/run/artistas/los-palos-logo.png",
        enfoque: "center 30%",
      },
    ],
    playlist: null,
  },
  {
    slug: "electronica",
    nombre: "Electrónica",
    descripcion:
      "Beats sin pausa entre canción y canción, con cuatro DJs que se turnan la tarde. Es la zona de quien llegó a bailar y no piensa sentarse: se entra sabiendo que se sale hasta que apaguen las bocinas.",
    artistas: [
      {
        nombre: "Uplasek",
        foto: "/run/artistas/uplasek.jpg",
        ajuste: "contener",
        logo: "/run/artistas/uplasek-logo.png",
      },
      {
        nombre: "Alan P",
        foto: "/run/artistas/alan-p.jpg",
        ajuste: "contener",
        logo: "/run/artistas/alan-p-logo.png",
      },
      {
        nombre: "Roof",
        foto: "/run/artistas/roof.jpg",
        ajuste: "contener",
        logo: "/run/artistas/roof-logo.png",
      },
      {
        nombre: "Salo",
        foto: "/run/artistas/salo.jpg",
        ajuste: "contener",
        logo: "/run/artistas/salo-logo.png",
      },
    ],
    playlist: null,
  },
  {
    slug: "mariachi",
    nombre: "Mariachi",
    descripcion:
      "Trompetas, violines y guitarrón con el mariachi de casa. Los clásicos de siempre para cantarse con el corazón en la mano, con el grito bien dado y sin esperar a que alguien más empiece.",
    artistas: [
      {
        nombre: "Mariachi Internacional Durango",
        foto: "/run/artistas/mariachi-internacional-durango.jpg",
        logo: "/run/artistas/mariachi-internacional-durango-logo.png",
      },
    ],
    playlist: null,
  },
  {
    slug: "ska",
    nombre: "Ska",
    descripcion:
      "Ska del que se brinca, no del que se oye sentado. Metales, coros a todo pulmón y gente que no se conoce entre sí cantando exactamente lo mismo, sin ponerse de acuerdo.",
    artistas: [
      {
        nombre: "Los Rifers",
        foto: "/run/artistas/los-rifers.jpeg",
        ajuste: "contener",
        logo: "/run/artistas/los-rifers-logo.png",
      },
    ],
    playlist: null,
  },
  {
    slug: "oldies",
    nombre: "Oldies",
    descripcion:
      "Los clásicos de ayer en la voz de Octava Década. De esas canciones que todo mundo se sabe aunque jure que no, para cantar con los ojos cerrados y sin pena, que para eso vino.",
    artistas: [
      {
        nombre: "Octava Década",
        foto: "/run/artistas/octava-decada.jpg",
        logo: "/run/artistas/octava-decada-logo.png",
      },
    ],
    playlist: null,
  },
];