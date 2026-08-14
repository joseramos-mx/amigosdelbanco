"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import jsQR from "jsqr";
import type { FilaPadron } from "@/lib/run/padron";
import { button } from "motion/react-client";

/**
 * Escáner de entrega de kits.
 *
 * Diseñado para una explanada sin señal: valida contra el padrón que cacheó
 * antes de abrir y encola las entregas. Cuando hay red, sincroniza. Si el
 * navegador se cierra, la cola sobrevive en localStorage.
 *
 * Nunca rechaza en silencio: un boleto repetido se marca en ámbar con la hora
 * de la primera entrega, para que quien está en la mesa decida. Casi siempre
 * es la misma persona mostrando el QR otra vez; a veces no.
 */

const CLAVE_COLA = "run_cola_checkin";
const EVENTO_COLA = "run:cola";

/**
 * La cola vive en localStorage y se lee con useSyncExternalStore en vez de
 * copiarla a estado dentro de un efecto: así no hay un render extra por cada
 * escaneo, y si el navegador se cierra a media entrega, lo pendiente sigue
 * ahí al volver.
 */
function leerCola(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_COLA) ?? "[]");
  } catch {
    return [];
  }
}

function guardarCola(cola: string[]): void {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
  window.dispatchEvent(new Event(EVENTO_COLA));
}

function suscribirCola(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_COLA, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_COLA, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}
const CLAVE_VISTOS = "run_qr_vistos";

function leerVistos(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(CLAVE_VISTOS) ?? "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function guardarVistos(vistos: Set<string>): void {
  try {
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify([...vistos]));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

type Veredicto = "entregado" | "repetido" | "sin_activar" | "desconocido";

type Registro = {
  qr: string;
  boletoId: string;
  nombre: string;
  dorsal: number | null;
  veredicto: Veredicto;
  detalle?: string;
  hora: number;
  sincronizado: boolean;
};

const COLORES: Record<Veredicto, string> = {
  entregado: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  repetido: "border-amber-500/50 bg-amber-500/10 text-amber-200",
  sin_activar: "border-orange-500/50 bg-orange-500/10 text-orange-200",
  desconocido: "border-red-500/50 bg-red-500/10 text-red-200",
};

const TITULOS: Record<Veredicto, string> = {
  entregado: "Kit entregado",
  repetido: "Ya se había entregado",
  sin_activar: "Faltan sus datos",
  desconocido: "No reconocido",
};

export default function Escaner({ padronInicial }: { padronInicial: FilaPadron[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ultimoRef = useRef<{ qr: string; hora: number }>({ qr: "", hora: 0 });
  const vistosRef = useRef<Set<string>>(
    typeof window !== "undefined" ? leerVistos() : new Set(),
  );

  const [registros, setRegistros] = useState<Registro[]>([]);
  // El padrón llega del servidor y no se cachea: la página se renderiza en el
  // servidor, así que sin red no habría cómo abrirla y leer el caché.
  const padron = padronInicial;
  const pendientes = useSyncExternalStore(
    suscribirCola,
    () => leerCola().length,
    () => 0,
  );
  const [enLinea, setEnLinea] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activo, setActivo] = useState(false);
  const [folioInput, setFolioInput] = useState("");

  useEffect(() => {
    const alCambiar = () => setEnLinea(navigator.onLine);
    alCambiar();
    window.addEventListener("online", alCambiar);
    window.addEventListener("offline", alCambiar);
    return () => {
      window.removeEventListener("online", alCambiar);
      window.removeEventListener("offline", alCambiar);
    };
  }, []);

  const encolar = useCallback((qr: string) => {
    guardarCola([...leerCola(), qr]);
  }, []);

  const sincronizar = useCallback(async () => {
    const cola = leerCola();
    if (!cola.length) return;

    try {
      const res = await fetch("/api/run/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escaneos: cola.map((qr) => ({ qr })) }),
      });
      if (!res.ok) return; // se conserva la cola y se reintenta

      const { resultados } = await res.json();
      guardarCola([]);

      // El servidor manda la verdad: puede corregir un "entregado" local a
      // "repetido" si otra mesa escaneó primero.
      setRegistros((previos) =>
        previos.map((r) => {
          if (r.veredicto !== "entregado" || r.sincronizado) return r;
          const server = resultados.find(
            (x: { qr: string }) => x.qr === r.qr,
          );
          if (!server) return r;
          return {
            ...r,
            sincronizado: true,
            veredicto:
              server.resultado === "entregado"
                ? "entregado"
                : server.resultado === "repetido"
                  ? "repetido"
                  : server.resultado === "sin_activar"
                    ? "sin_activar"
                    : "desconocido",
            detalle:
              server.resultado !== "entregado" && server.registradoEn
                ? `Primera entrega: ${new Date(server.registradoEn).toLocaleTimeString("es-MX")}`
                : r.detalle,
          };
        }),
      );
    } catch {
      /* sigue sin red: la cola se queda */
    }
  }, []);

  useEffect(() => {
    if (!enLinea) return;
    // El primer envío sale fuera de la fase de montaje, no dentro: así una
    // respuesta lenta no encadena renders mientras la pantalla se arma.
    const primero = window.setTimeout(() => void sincronizar(), 0);
    const intervalo = window.setInterval(() => void sincronizar(), 15_000);
    return () => {
      window.clearTimeout(primero);
      window.clearInterval(intervalo);
    };
  }, [enLinea, sincronizar]);

  const procesar = useCallback(
    (qr: string) => {
      // Anti-rebote: la cámara lee el mismo código treinta veces por segundo.
      const ahora = Date.now();
      if (ultimoRef.current.qr === qr && ahora - ultimoRef.current.hora < 3000) return;
      ultimoRef.current = { qr, hora: ahora };

      const fila = padron.find((f) => f.qr === qr);
      if (!fila) {
        const desconocido: Registro = {
          qr, boletoId: "", nombre: "—", dorsal: null, veredicto: "desconocido",
          detalle: "No está en el padrón de este evento", hora: ahora, sincronizado: false,
        };
        setRegistros((r) => [desconocido, ...r].slice(0, 60));
        return;
      }

      const yaEntregadoAqui = fila.entregado || vistosRef.current.has(qr);
      const veredicto: Veredicto = yaEntregadoAqui ? "repetido" : "entregado";

      const registro: Registro = {
        qr,
        boletoId: fila.id,
        nombre: [fila.nombre, fila.apellidos].filter(Boolean).join(" ") || fila.folio,
        dorsal: fila.dorsal,
        veredicto,
        detalle: veredicto === "repetido" ? "Verifica con la persona" : fila.talla_playera
          ? `Talla ${fila.talla_playera}`
          : undefined,
        hora: ahora,
        sincronizado: false,
      };
      setRegistros((r) => [registro, ...r].slice(0, 60));

      if (veredicto === "entregado") {
        vistosRef.current.add(qr);
        guardarVistos(vistosRef.current);
        encolar(qr);
        if (navigator.vibrate) navigator.vibrate(60);
      } else if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    },
    [padron, encolar],
  );

  const handleFolioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioInput) return;
    const folioStr = `GG-${folioInput.padStart(5, "0")}`;
    const fila = padron.find((f) => f.folio === folioStr);

    if (fila) {
      procesar(fila.qr);
    } else {
      procesar(`MANUAL-NOT-FOUND-${folioStr}`); // Genera error de desconocido
    }
    setFolioInput("");
  };

  useEffect(() => {
    if (!activo) return;
    let flujo: MediaStream | null = null;
    let animacion = 0;
    let cancelado = false;

    async function abrir() {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const video = videoRef.current;
        if (!video || cancelado) return;
        video.srcObject = flujo;
        await video.play();
        leer();
      } catch {
        setError(
          "No pudimos abrir la cámara. Revisa los permisos del navegador y que la página esté en https.",
        );
        setActivo(false);
      }
    }

    function leer() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || cancelado) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ancho = 480;
        const alto = Math.round((video.videoHeight / video.videoWidth) * ancho) || 480;
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, ancho, alto);
          const imagen = ctx.getImageData(0, 0, ancho, alto);
          const codigo = jsQR(imagen.data, ancho, alto, { inversionAttempts: "dontInvert" });
          if (codigo?.data) procesar(codigo.data);
        }
      }
      animacion = requestAnimationFrame(leer);
    }

    void abrir();
    return () => {
      cancelado = true;
      cancelAnimationFrame(animacion);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [activo, procesar]);

  const entregados = registros.filter((r) => r.veredicto === "entregado").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-geist-mono text-[10px] uppercase tracking-[0.16em] ${enLinea ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
            }`}
        >
          {enLinea ? "En línea" : "Sin conexión"}
        </span>
        <span className="text-white/50">
          {padron.length} inscritos en memoria · {entregados} entregados aquí
        </span>
        {pendientes > 0 && (
          <span className="text-amber-300">{pendientes} por sincronizar</span>
        )}
      </div>

      <form onSubmit={handleFolioSubmit} className="flex gap-2">
        <div className="flex w-full items-center rounded-lg border border-neutral-700 bg-neutral-800 focus-within:border-run-amber focus-within:ring-1 focus-within:ring-run-amber transition-colors">
          <span className="flex self-stretch items-center border-r border-neutral-700 px-3 font-mono text-neutral-400 sm:text-sm">
            GG-
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d+"
            maxLength={5}
            value={folioInput}
            onChange={(e) => setFolioInput(e.target.value.replace(/\D/g, ""))}
            placeholder="00001"
            className="w-full bg-transparent py-2 px-3 font-mono text-white placeholder:text-neutral-600 focus:outline-none sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-run-amber px-5 py-2 text-sm uppercase tracking-wide text-black"
        >
          VALIDAR
        </button>
      </form>

      <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-black">
        <video ref={videoRef} playsInline muted className="h-auto w-full" />
        <canvas ref={canvasRef} className="hidden" />
        {!activo && (
          <div className="flex aspect-4/3 items-center justify-center">
            <button
              onClick={() => { setError(null); setActivo(true); }}
              className="rounded-md bg-run-amber px-6 py-3 text-sm uppercase tracking-wide text-black"
            >
              Encender cámara
            </button>
          </div>
        )}
        {activo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2 border-run-amber/70" />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {activo && (
        <button
          onClick={() => setActivo(false)}
          className="text-sm text-white/50 underline-offset-4 hover:text-white"
        >
          Apagar cámara
        </button>
      )}


      <ul className="space-y-2">
        {registros.map((r) => (
          <li
            key={`${r.qr}-${r.hora}`}
            className={`rounded-xl border px-4 py-3 ${COLORES[r.veredicto]}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{TITULOS[r.veredicto]}</span>
              <span className="font-geist-mono text-[10px] opacity-70">
                {new Date(r.hora).toLocaleTimeString("es-MX")}
                {!r.sincronizado && pendientes > 0 ? " · en cola" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-white">
              {r.dorsal ? `#${r.dorsal} · ` : ""}
              {r.nombre}
            </p>
            {r.detalle && <p className="mt-0.5 text-xs opacity-80">{r.detalle}</p>}
          </li>
        ))}
      </ul>

      {!registros.length && (
        <p className="text-sm text-white/40">
          Apunta la cámara al QR del boleto. Funciona sin señal: lo que escanees se
          guarda y se sincroniza cuando vuelva la red.
        </p>
      )}
    </div>
  );
}