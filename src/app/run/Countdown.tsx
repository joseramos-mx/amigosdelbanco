"use client";

import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
}

function remainingFrom(targetMs: number): Remaining {
  const ms = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ targetIso }: { targetIso: string }) {
  const targetMs = new Date(targetIso).getTime();
  // Null hasta montar — el servidor no tiene reloj con el que coincidir.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setLeft(remainingFrom(targetMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const started =
    left !== null && left.days + left.hours + left.minutes === 0;

  return (
    <>
      <p className="sr-only">
        {left
          ? `Faltan ${left.days} días, ${left.hours} horas y ${left.minutes} minutos.`
          : "Cargando la cuenta regresiva."}
      </p>
      <p
        aria-hidden
        className="font-schabo text-[22vw] leading-[0.8] tracking-tight tabular-nums lg:text-[clamp(5rem,11.5vw,10.5rem)]"
      >
        {started
          ? "¡HOY!"
          : left
            ? `${pad(left.days)}:${pad(left.hours)}:${pad(left.minutes)}`
            : "--:--:--"}
      </p>
    </>
  );
}
