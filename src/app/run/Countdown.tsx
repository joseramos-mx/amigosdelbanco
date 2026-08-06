"use client";

import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingFrom(targetMs: number): Remaining {
  const ms = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1_000) % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Tamaño por omisión: el de la portada, donde el reloj es la pieza grande. */
const CLASE_PORTADA =
  "font-schabo text-[22vw] leading-[0.8] tracking-tight tabular-nums lg:text-[clamp(5rem,13vw,13rem)]";

export default function Countdown({
  targetIso,
  clase = CLASE_PORTADA,
  alLlegar = "¡HOY!",
}: {
  targetIso: string;
  /** Con qué se dibuja. Se cambia entero, no se agrega: son clases de tamaño. */
  clase?: string;
  /** Qué decir al llegar a cero. */
  alLlegar?: string;
}) {
  const targetMs = new Date(targetIso).getTime();
  // Null hasta montar — el servidor no tiene reloj con el que coincidir.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    let id = 0;

    // El pulso se reengancha al filo de cada segundo en lugar de correr con
    // un intervalo fijo. Con `setInterval(1000)` el arranque cae donde caiga
    // y el desfase se nota: los segundos se ven brincar de 34 a 32 porque dos
    // lecturas seguidas caen dentro del mismo segundo del reloj.
    const tick = () => {
      setLeft(remainingFrom(targetMs));
      const alSiguiente = 1000 - (Date.now() % 1000);
      id = window.setTimeout(tick, alSiguiente);
    };
    tick();

    return () => window.clearTimeout(id);
  }, [targetMs]);

  const started =
    left !== null &&
    left.days + left.hours + left.minutes + left.seconds === 0;

  return (
    <>
      {/* El resumen hablado se queda en días, horas y minutos. Los segundos
          sirven para mirarlos, no para escucharlos: en un lector de pantalla
          solo alargan la frase con un dato que ya cambió al terminar de
          leerla. */}
      <p className="sr-only">
        {left
          ? `Faltan ${left.days} días, ${left.hours} horas y ${left.minutes} minutos.`
          : "Cargando la cuenta regresiva."}
      </p>
      <p aria-hidden className={clase}>
        {started
          ? alLlegar
          : left
            ? `${pad(left.days)}:${pad(left.hours)}:${pad(left.minutes)}:${pad(left.seconds)}`
            : "--:--:--:--"}
      </p>
    </>
  );
}
