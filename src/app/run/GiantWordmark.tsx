"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// SCHABO mide 2.79em de ancho en "GENEROUS" y 0.8em de caja alta. El tope de
// 537px evita que 32vw crezca más que el contenedor de 1500px (1500 / 2.79);
// el margen negativo corta ~10% de abajo contra el overflow-hidden del footer.
export default function GiantWordmark() {
  const ref = useRef<HTMLParagraphElement>(null);

  // Sube un poco mientras el pie entra en pantalla.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [70, 0]);
  const opacity = useTransform(scrollYProgress, [0.05, 0.6], [0.15, 1]);

  return (
    <motion.p
      ref={ref}
      aria-hidden
      style={{ y, opacity }}
      className="mx-auto mt-20 mb-[-0.18em] max-w-[1500px] select-none text-center font-schabo text-[min(32vw,537px)] uppercase leading-[0.8] text-white/6 lg:mt-28"
    >
      Generous
    </motion.p>
  );
}
