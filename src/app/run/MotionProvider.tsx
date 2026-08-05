"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

// reducedMotion="user" respeta la preferencia del sistema sin cambiar el árbol
// renderizado: salta desplazamientos y transformaciones, pero deja que la
// opacidad llegue a 1 — así el contenido nunca se queda invisible.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
