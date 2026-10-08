"use client";

import { useEffect, useRef, useState } from "react";
// import type { Alcance, DonacionOverlay, RespuestaOverlay } from "@/lib/run/overlay-donaciones";
import type { Alcance, DonacionOverlay, RespuestaOverlay } from "@/lib/run/overlay-donaciones";

type Opciones = {
  clave?: string;
  alcance: Alcance;
  limite: number;
  /** Datos falsos para probar el diseño sin donaciones reales (?demo=1) */
  demo?: boolean;
  intervaloMs?: number;
  /** Se llama con las donaciones nuevas (más antigua primero). No se dispara en la primera carga. */
  onNuevas?: (nuevas: DonacionOverlay[]) => void;
};

export function useDonaciones({ clave, alcance, limite, demo, intervaloMs = 4000, onNuevas }: Opciones) {
  const [datos, setDatos] = useState<RespuestaOverlay | null>(null);
  const [conectado, setConectado] = useState(true);
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());
  const desfase = useRef(0); // servidor - cliente
  const cb = useRef(onNuevas);
  cb.current = onNuevas;

  // Reloj para refrescar los "hace X minutos" sin volver a pedir datos.
  useEffect(() => {
    const t = setInterval(() => setAhoraMs(Date.now() + desfase.current), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    const vistos = new Set<string>();
    let primera = true;

    async function ciclo() {
      try {
        const r = demo ? respuestaDemo(alcance, limite) : await pedir(clave, alcance, limite);
        if (!vivo) return;
        desfase.current = Date.parse(r.ahora) - Date.now();
        setAhoraMs(Date.now() + desfase.current);
        setDatos(r);
        setConectado(true);

        const nuevas = r.recientes.filter((d) => !vistos.has(d.id));
        r.recientes.forEach((d) => vistos.add(d.id));
        if (!primera && nuevas.length) cb.current?.(nuevas.reverse());
        primera = false;
      } catch {
        // Conserva lo último que se mostró: en vivo nunca debe parpadear un error.
        if (vivo) setConectado(false);
      } finally {
        if (vivo) timer = setTimeout(ciclo, intervaloMs);
      }
    }
    ciclo();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [clave, alcance, limite, demo, intervaloMs]);

  return { datos, conectado, ahoraMs };
}

async function pedir(clave: string | undefined, alcance: Alcance, limite: number) {
  const qs = new URLSearchParams({ alcance, limite: String(limite) });
  if (clave) qs.set("key", clave);
  const res = await fetch(`/api/run/overlay/donaciones?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as RespuestaOverlay;
}

/* ---------- modo demo ---------- */

const NOMBRES = ["Marina Gómez", "Carlos Hernández", "Fernanda Ruiz", "Luis Soto", null, "Ana Valdez", "Jorge Núñez", "Paola Méndez", "Roberto Chávez", "Daniela Ortiz"];
const MONTOS = [5000, 10000, 20000, 30000, 50000, 100000];
let almacen: DonacionOverlay[] | null = null;
let ultimaDemo = 0;

function respuestaDemo(alcance: Alcance, limite: number): RespuestaOverlay {
  const ahora = Date.now();
  if (!almacen) {
    almacen = Array.from({ length: 30 }, (_, i) => ({
      id: `demo-${i}`,
      nombre: NOMBRES[i % NOMBRES.length],
      centavos: MONTOS[i % MONTOS.length],
      creadoEn: new Date(ahora - (i * 7 + 3) * 60_000 - (i > 12 ? 3 * 86_400_000 : 0)).toISOString(),
    }));
    ultimaDemo = ahora;
  }
  if (ahora - ultimaDemo > 9000) {
    ultimaDemo = ahora;
    const n = almacen.length;
    almacen.unshift({
      id: `demo-${n}-${ahora}`,
      nombre: NOMBRES[n % NOMBRES.length],
      centavos: MONTOS[n % MONTOS.length],
      creadoEn: new Date(ahora).toISOString(),
    });
  }
  const lista = alcance === "hoy" ? almacen.filter((d) => Date.parse(d.creadoEn) > ahora - 86_400_000) : almacen;
  return {
    ahora: new Date(ahora).toISOString(),
    totalCentavos: lista.reduce((s, d) => s + d.centavos, 0),
    cantidad: lista.length,
    recientes: lista.slice(0, limite),
  };
}
