"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retraso en milisegundos, para escalonar la entrada. */
  delay?: number;
  y?: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Envuelve la celda directamente: la clase se aplica al elemento animado, así
// que las posiciones del grid (col-start, row-span…) siguen intactas.
//
// El árbol es idéntico en servidor y cliente a propósito. Si se ramificara
// según prefers-reduced-motion, React detectaría un mismatch, no parcharía el
// `style` del SSR y el contenido se quedaría en opacity:0 para siempre. La
// preferencia se respeta desde <MotionConfig reducedMotion="user"> en el
// layout, que salta la transformación pero deja aparecer la opacidad.
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
