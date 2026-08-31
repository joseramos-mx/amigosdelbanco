"use client";

import { useEffect, useState } from "react";

const totalImagenes = 7;

export default function ImagenAleatoria() {
  const [numero, setNumero] = useState<number | null>(null);

  useEffect(() => {
    const aleatorio = Math.floor(Math.random() * totalImagenes) + 1;
    setNumero(aleatorio);
  }, []);

  // Mientras se decide el número (para evitar hydrate mismatch), mostramos un fondo oscuro.
  if (numero === null) {
    return <div className="h-full w-full bg-[#111]" />;
  }

  return (
    <img
      src={`/run/runners/runner${numero}.webp`}
      alt="Runner"
      className="h-full w-full object-cover"
    />
  );
}
