import Reveal from "./Reveal";
import FilaMood from "./FilaMood";
import { MOODS } from "@/lib/run/moods";

/**
 * Tercera sección de la landing: los moods del festival.
 *
 * Una fila por género, alternando de lado: foto grande del artista y, junto a
 * ella, una tarjeta clara con su logo y la descripción. La alternancia se
 * hace con `order` en pantalla grande; al apilarse en celular vuelve al orden
 * del documento, que es el que se lee bien — primero la foto, luego el texto
 * que la explica.
 *
 * Cada fila vive en `FilaMood`, que es el componente de cliente: los moods con
 * varios artistas (Electrónica) muestran la foto como carrusel y el logo de la
 * tarjeta cambia junto con ella.
 */
export default function SeccionMoods() {
  return (
    <section id="moods" className="px-4 pb-16 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-[1500px]">
        <div className="space-y-3 lg:space-y-4">
          {MOODS.map((mood, i) => (
            <Reveal key={mood.slug} delay={i * 80}>
              <FilaMood mood={mood} invertida={i % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}