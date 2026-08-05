"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import type { FilaPadron } from "@/lib/run/padron";

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
const CLAVE_PADRON = "run_padron";

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

  const [padron, setPadron] = useState<FilaPadron[]>(padronInicial);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [enLinea, setEnLinea] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activo, setActivo] = useState(false);

  // El padrón y la cola se guardan localmente: si el teléfono se bloquea o el
  // navegador se recarga, no se pierde nada.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_PADRON);
      if (guardado && !padronInicial.length) setPadron(JSON.parse(guardado));
      else if (padronInicial.length) {
        localStorage.setItem(CLAVE_PADRON, JSON.stringify(padronInicial));
      }
      setPendientes(JSON.parse(localStorage.getItem(CLAVE_COLA) ?? "[]").length);
    } catch {
      /* almacenamiento lleno o bloqueado: se sigue sin caché */
    }
  }, [padronInicial]);

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
    try {
      const cola: string[] = JSON.parse(localStorage.getItem(CLAVE_COLA) ?? "[]");
      cola.push(qr);
      localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
      setPendientes(cola.length);
    } catch {
      /* sin almacenamiento, se intentará mandar de inmediato */
    }
  }, []);

  const sincronizar = useCallback(async () => {
    let cola: string[] = [];
    try {
      cola = JSON.parse(localStorage.getItem(CLAVE_COLA) ?? "[]");
    } catch {
      return;
    }
    if (!cola.length) return;

    try {
      const res = await fetch("/api/run/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escaneos: cola.map((qr) => ({ qr })) }),
      });
      if (!res.ok) return; // se conserva la cola y se reintenta

      const { resultados } = await res.json();
      localStorage.setItem(CLAVE_COLA, "[]");
      setPendientes(0);

      // El servidor manda la verdad: puede corregir un "entregado" local a
      // "repetido" si otra mesa escaneó primero.
      setRegistros((previos) =>
        previos.map((r) => {
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
            detalle: server.registradoEn
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
    void sincronizar();
    const id = window.setInterval(() => void sincronizar(), 15_000);
    return () => window.clearInterval(id);
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

      const yaEnPantalla = registros.find((r) => r.qr === qr);
      const veredicto: Veredicto = fila.entregado || yaEnPantalla ? "repetido" : "entregado";

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
        encolar(qr);
        if (navigator.vibrate) navigator.vibrate(60);
      } else if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    },
    [padron, registros, encolar],
  );

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
          className={`rounded-full px-3 py-1 font-geist-mono text-[10px] uppercase tracking-[0.16em] ${
            enLinea ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
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
