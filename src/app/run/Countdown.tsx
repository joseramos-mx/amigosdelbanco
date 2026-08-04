"use client";

import { useEffect, useState } from "react";

const UNITS = [
  { key: "days", label: "Días" },
  { key: "hours", label: "Horas" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Seg" },
] as const;

type Remaining = Record<(typeof UNITS)[number]["key"], number>;

function remainingFrom(targetMs: number): Remaining {
  const ms = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1_000) % 60,
  };
}

export default function Countdown({ targetIso }: { targetIso: string }) {
  const targetMs = new Date(targetIso).getTime();
  // Null until mounted — the server has no clock to agree with.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setLeft(remainingFrom(targetMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const started =
    left !== null && left.days + left.hours + left.minutes + left.seconds === 0;

  if (started) {
    return (
      <p className="font-schabo text-[clamp(2.5rem,7vw,5.5rem)] uppercase leading-[0.85] tracking-tight">
        ¡Hoy corremos juntos!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 divide-x divide-black/15" aria-hidden>
      {UNITS.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center px-1">
          <span className="font-schabo text-[clamp(3.25rem,12vw,4.5rem)] leading-[0.78] tabular-nums lg:text-[clamp(3.5rem,7vw,7rem)]">
            {left ? String(left[key]).padStart(2, "0") : "––"}
          </span>
          <span className="mt-2 font-geist-mono text-[9px] uppercase tracking-[0.22em] text-black/55 sm:text-[11px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
