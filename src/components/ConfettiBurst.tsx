"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const COLORS = ["#fcb51d", "#1d4dfc", "#9ae600", "#ffffff", "#f59e0b"];

export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fire = confetti.create(canvas, { resize: true });

    const burst = (opts: confetti.Options) =>
      fire({ colors: COLORS, ...opts });

    const t0 = setTimeout(() => {
      burst({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        startVelocity: 45,
      });
    }, 50);

    const t1 = setTimeout(() => {
      burst({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
    }, 230);

    const t2 = setTimeout(() => {
      burst({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 410);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      fire.reset();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9999, width: "100vw", height: "100vh" }}
    />
  );
}
