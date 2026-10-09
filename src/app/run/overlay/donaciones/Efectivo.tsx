"use client";

import { useEffect, useRef, useState } from "react";
import { formatMxn } from "@/lib/donation";

type Props = { clave?: string; alcance: "hoy" | "todo"; demo?: boolean; fondo?: boolean };
type Donacion = { id: string; nombre: string | null; centavos: number };
type Respuesta = { totalCentavos: number; hoyCentavos: number; cantidad: number; ultimas: Donacion[] };
type Aviso = Donacion & { dur: number };

const INTERVALO_MS = 3000;
const DURACION_CONTEO_MS = 1400;

export default function Efectivo({ clave, alcance, demo, fondo }: Props) {
  const [objetivo, setObjetivo] = useState<number | null>(null); // centavos reales
  const [mostrado, setMostrado] = useState(0); // centavos en pantalla (animado)
  const [cantidad, setCantidad] = useState(0);
  const [cola, setCola] = useState<Donacion[]>([]); // donaciones por anunciar
  const [aviso, setAviso] = useState<Aviso | null>(null); // la que se muestra ahora
  const vistos = useRef<Set<string> | null>(null);
  const [pulso, setPulso] = useState(0);

  const previo = useRef<number | null>(null);
  const mostradoRef = useRef(0);
  mostradoRef.current = mostrado;
  // true = el próximo cambio de total es una ANULACIÓN: se muestra directo, sin conteo animado.
  const sinAnimar = useRef(false);

  /* ---------- consulta en vivo ---------- */
  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;

    async function ciclo() {
      try {
        const r = demo ? respuestaDemo() : await pedir(clave);
        if (!vivo) return;
        const total = alcance === "hoy" ? r.hoyCentavos : r.totalCentavos;
        setCantidad(r.cantidad);
        if (previo.current !== null && total < previo.current) sinAnimar.current = true; // anulación
        setObjetivo(total);

        if (previo.current === null) {
          // Primera carga: se muestra directo, sin animación.
          setMostrado(total);
        } else if (total > previo.current) {
          setPulso((p) => p + 1); // pulso de luz + brillo cuando sube el total
        }
        // (Si el total bajó, es una anulación: no hay pulso ni brillo y el número cambia directo.)
        previo.current = total;

        // Avisos con nombre y monto: solo donaciones NUEVAS (la primera carga no anuncia nada).
        if (vistos.current === null) {
          vistos.current = new Set(r.ultimas.map((u) => u.id));
        } else {
          // Una donación nueva siempre aparece ARRIBA de la lista (la más reciente primero).
          // Se toman las no vistas desde arriba hasta toparse con una ya vista. Así, cuando se anula
          // una donación y otra vieja se recorre hacia la lista por abajo, NO se anuncia como nueva.
          const nuevas: Donacion[] = [];
          for (const u of r.ultimas) {
            if (vistos.current.has(u.id)) break;
            nuevas.push(u);
          }
          r.ultimas.forEach((u) => vistos.current!.add(u.id));
          if (nuevas.length) setCola((c) => [...c, ...nuevas.reverse()].slice(-8)); // la más antigua primero
        }
      } catch {
        // En vivo nunca debe parpadear un error: se conserva lo último mostrado.
      } finally {
        if (vivo) timer = setTimeout(ciclo, INTERVALO_MS);
      }
    }
    ciclo();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [clave, alcance, demo]);

  /* ---------- conteo animado hacia el nuevo total ---------- */
  useEffect(() => {
    if (objetivo === null) return;
    if (sinAnimar.current) {
      // Anulación: el número cambia al instante, sin contar.
      sinAnimar.current = false;
      setMostrado(objetivo);
      return;
    }
    const desde = mostradoRef.current;
    if (desde === objetivo) return;
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min((t - t0) / DURACION_CONTEO_MS, 1);
      const suave = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setMostrado(p >= 1 ? objetivo : desde + (objetivo - desde) * suave);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo]);

  // Saca el siguiente aviso de la cola cuando no hay ninguno en pantalla.
  useEffect(() => {
    if (aviso || cola.length === 0) return;
    const [sig, ...resto] = cola;
    // Si se acumulan varias, cada una dura menos para no ir atrasados respecto al directo.
    setAviso({ ...sig, dur: resto.length >= 1 ? 3200 : 5000 });
    setCola(resto);
  }, [aviso, cola]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.dur);
    return () => clearTimeout(t);
  }, [aviso]);

  const etiqueta = alcance === "hoy" ? "Recaudado hoy" : "Donaciones del evento";
  const pesosEnteros = Math.round(mostrado / 100) * 100; // durante el conteo no se ven centavos sueltos

  return (
    <main className="flex h-svh w-full flex-col p-[2vmin]">
      {fondo && <div className="fixed inset-0 -z-10 bg-black" />}
      <style>{`
        @keyframes efe-pop {
          0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgb(255 190 40 / .0); }
          25%  { transform: scale(1.025); box-shadow: 0 0 0 1.6vmin rgb(255 190 40 / .55); }
          100% { transform: scale(1);    box-shadow: 0 0 0 5vmin rgb(255 190 40 / 0); }
        }
        @keyframes efe-aviso {
          0%   { transform: translateY(60%) scale(.92); opacity: 0; }
          9%   { transform: translateY(0)   scale(1.04); opacity: 1; }
          14%  { transform: translateY(0)   scale(1);   opacity: 1; }
          88%  { transform: translateY(0)   scale(1);   opacity: 1; }
          100% { transform: translateY(-30%) scale(.97); opacity: 0; }
        }
        @keyframes efe-brillo {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(110%); }
        }
      `}</style>

      {/* La key reinicia la animación de "pop" en cada nueva donación */}
      <section
        key={pulso}
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[4vmin] border-[.6vmin] border-run-amber bg-gradient-to-br from-[#3a2c0e] via-[#262014] to-[#171717] [container-type:size]"
        style={pulso > 0 ? { animation: "efe-pop 1.4s ease-out both" } : undefined}
      >
        <span aria-hidden className="pointer-events-none absolute -right-[12cqmin] -top-[16cqmin] h-[60cqmin] w-[60cqmin] rounded-full bg-run-amber/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-[20cqmin] -left-[14cqmin] h-[50cqmin] w-[50cqmin] rounded-full bg-run-amber/10 blur-3xl" />

        {/* brillo que cruza la tarjeta cuando entra dinero */}
        {pulso > 0 && (
          <span
            key={`b${pulso}`}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ animation: "efe-brillo 1.3s ease-out both" }}
          />
        )}

        {/* Encabezado: logo + etiqueta */}
        <div className="relative flex items-center gap-[3cqh] mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/run/logo.png"
            alt="Banco de Alimentos de Durango"
            className="h-[22cqh] w-auto shrink-0 object-contain"
          />
          <p className="flex items-center gap-[1.6cqh] font-geist-mono text-[clamp(.7rem,5.4cqh,2rem)] font-bold uppercase tracking-[0.2em] text-run-amber">
            <span className="inline-block h-[3cqh] w-[3cqh] min-h-2 min-w-2 animate-pulse rounded-full bg-run-amber" />
            {etiqueta}
          </p>
        </div>

        {/* Total grande */}
        <p className="relative mt-[3cqh] font-schabo text-[min(40cqh,19cqw)] uppercase leading-none text-run-amber [font-variant-numeric:tabular-nums] [text-shadow:0_0_6cqmin_rgb(255_190_40/.4)]">
          {objetivo === null ? "—" : formatMxn(pesosEnteros)}
        </p>

        <div className="relative mt-[2cqh] flex h-[18cqh] w-full items-center justify-center px-[4cqw]">
          {aviso ? (
            <div
              key={aviso.id}
              className="flex max-w-full items-center overflow-hidden rounded-full border-[.5cqh] border-run-amber bg-black/55 shadow-[0_1cqh_3cqh_rgba(0,0,0,.5)]"
              style={{ animation: `efe-aviso ${aviso.dur}ms cubic-bezier(.2,.8,.2,1) both` }}
            >
              <span className="shrink-0 bg-run-amber px-[3.2cqh] py-[1.8cqh] font-schabo text-[min(13cqh,6.5cqw)] uppercase leading-none text-black">
                <span className="inline-block translate-y-[0.06em]">+{formatMxn(aviso.centavos)}</span>
              </span>
              <span className="min-w-0 truncate px-[3.2cqh] text-[clamp(1rem,8cqh,3rem)] font-medium text-white">
                {aviso.nombre?.trim() || "Donador anónimo"} · ¡Gracias! 💛
              </span>
            </div>
          ) : (
            alcance === "todo" &&
            cantidad > 0 && (
              <p className="text-[clamp(.9rem,6cqh,2.4rem)] text-white/85">
                {cantidad} {cantidad === 1 ? "aportación" : "aportaciones"} · ¡Gracias! 💛
              </p>
            )
          )}
        </div>
      </section>
    </main>
  );
}

/* ---------- datos ---------- */

async function pedir(clave?: string): Promise<Respuesta> {
  const qs = new URLSearchParams();
  if (clave) qs.set("key", clave);
  const res = await fetch(`/api/run/overlay/efectivo?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as Respuesta;
}

/* modo demo (?demo=1): suma una donación al azar cada ~7 s */
const NOMBRES_DEMO = ["Marina Gómez", "Carlos Hernández", null, "Fernanda Ruiz", "Luis Soto", "Ana Valdez"];
let demoTotal = 450_000; // $4,500
let demoCantidad = 38;
let demoUltima = 0;
let demoLista: Donacion[] = [];
function respuestaDemo(): Respuesta {
  const ahora = Date.now();
  if (demoUltima === 0) demoUltima = ahora;
  if (ahora - demoUltima > 7000) {
    demoUltima = ahora;
    const montos = [2000, 5000, 10000, 20000, 50000];
    const centavos = montos[Math.floor(Math.random() * montos.length)];
    demoTotal += centavos;
    demoCantidad += 1;
    demoLista = [
      { id: `demo-${demoCantidad}`, nombre: NOMBRES_DEMO[demoCantidad % NOMBRES_DEMO.length], centavos },
      ...demoLista,
    ].slice(0, 8);
  }
  return { totalCentavos: demoTotal, hoyCentavos: demoTotal, cantidad: demoCantidad, ultimas: demoLista };
}