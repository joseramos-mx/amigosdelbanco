"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Artista } from "@/lib/run/moods";

const CADA_MS = 5000;

/**
 * La foto grande de un mood.
 *
 * Con un solo artista es una imagen fija. Con varios (Electrónica) se vuelve
 * carrusel: cambia sola cada 5 segundos con un fundido, se detiene si el
 * cursor está encima o si la persona pidió menos movimiento, y también se
 * puede cambiar con los puntos, las flechas o deslizando en el celular.
 *
 * Qué artista está a la vista lo decide el padre (`activo`), porque el logo
 * de la tarjeta de texto tiene que cambiar junto con la foto.
 *
 * Ocupa todo el contenedor padre (`absolute inset-0`), que debe ser
 * `relative` y llevar el recorte redondeado.
 */
export default function PanelArtista({
    artistas,
    activo,
    onCambiar,
}: {
    artistas: Artista[];
    activo: number;
    onCambiar: (i: number) => void;
}) {
    const total = artistas.length;
    const hayVarios = total > 1;
    const [pausado, setPausado] = useState(false);
    const inicioX = useRef<number | null>(null);

    const ir = useCallback(
        (i: number) => onCambiar(((i % total) + total) % total),
        [total, onCambiar],
    );

    // Se reinicia el reloj cada vez que cambia la diapositiva, para que un clic
    // manual no sea seguido por un salto inmediato.
    useEffect(() => {
        if (!hayVarios || pausado) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const t = setTimeout(() => ir(activo + 1), CADA_MS);
        return () => clearTimeout(t);
    }, [hayVarios, pausado, activo, ir]);

    return (
        <div
            className="absolute inset-0"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            onFocus={() => setPausado(true)}
            onBlur={() => setPausado(false)}
            onTouchStart={(e) => {
                inicioX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
                if (inicioX.current === null || !hayVarios) return;
                const dx = e.changedTouches[0].clientX - inicioX.current;
                inicioX.current = null;
                if (Math.abs(dx) > 40) ir(activo + (dx < 0 ? 1 : -1));
            }}
            {...(hayVarios && {
                role: "group",
                "aria-roledescription": "carrusel",
                "aria-label": "Artistas del mood",
            })}
        >
            {artistas.map((a, i) => (
                <div
                    key={a.nombre}
                    aria-hidden={i !== activo}
                    className={`absolute inset-0 transition-opacity duration-700 ${i === activo ? "opacity-100" : "pointer-events-none opacity-0"
                        }`}
                >
                    {!a.foto ? (
                        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0c0c0c] p-6 text-neutral-100 sm:p-8 lg:p-10 select-none">
                            {/* Fondo radial cálido & resplandor */}
                            <div
                                className="pointer-events-none absolute inset-0 opacity-70"
                                style={{
                                    background:
                                        "radial-gradient(ellipse 85% 75% at 50% 50%, rgba(233, 166, 45, 0.18) 0%, rgba(12, 12, 12, 0.95) 100%)",
                                }}
                            />

                            {/* Marca de agua tipográfica gigante de fondo */}
                            <div className="pointer-events-none absolute -left-8 -top-6 text-[18vw] font-bold uppercase tracking-tight text-white/[0.03] font-schabo sm:text-[130px] lg:text-[160px] leading-none">
                                MARIACHI
                            </div>
                            <div className="pointer-events-none absolute -right-6 -bottom-6 text-[18vw] font-bold uppercase tracking-tight text-white/[0.03] font-schabo sm:text-[130px] lg:text-[160px] leading-none">
                                DURANGO
                            </div>

                            {/* Borde / marco estilizado */}
                            <div className="pointer-events-none absolute inset-3 rounded-[16px] border border-run-amber/25 sm:inset-4" />
                            <div className="pointer-events-none absolute inset-3.5 rounded-[14px] border border-white/[0.04] sm:inset-4.5" />

                            {/* Top Kicker */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-run-amber animate-pulse" />
                                    <span className="font-geist-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-run-amber">
                                        Mariachi en Vivo
                                    </span>
                                </div>
                                <span className="font-geist-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                                    El de casa
                                </span>
                            </div>

                            {/* Centro: Composición Tipográfica Principal al estilo del grupo */}
                            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
                                {/* • INTERNACIONAL • */}
                                <div className="flex items-center justify-center gap-2 sm:gap-3 text-run-amber font-schabo text-xl sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-[0.25em]">
                                    <span className="text-[10px] sm:text-xs">●</span>
                                    <span className="text-white tracking-[0.2em] drop-shadow-md">
                                        INTERNACIONAL
                                    </span>
                                    <span className="text-[10px] sm:text-xs">●</span>
                                </div>

                                {/* DURANGO (Western Rye font with spurs & center pinstripe) */}
                                <div className="relative my-1 sm:my-2 w-full max-w-2xl flex items-center justify-center">
                                    <div className="font-rye text-5xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl tracking-wider text-run-amber uppercase leading-none drop-shadow-[0_4px_35px_rgba(233,166,45,0.45)] select-none">
                                        DURANGO
                                    </div>
                                    {/* Línea horizontal que cruza las púas centrales de las letras como en el diseño original */}
                                    <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-white/45 mix-blend-overlay sm:inset-x-12" />
                                </div>

                                {/* —✦— MARIACHI —✦— */}
                                <div className="mt-0.5 flex items-center justify-center gap-2 sm:gap-3 text-run-amber">
                                    <span className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-run-amber" />
                                    <span className="text-[10px] sm:text-xs">✦</span>
                                    <span className="font-schabo text-base sm:text-lg md:text-xl tracking-[0.35em] text-neutral-200 uppercase">
                                        MARIACHI
                                    </span>
                                    <span className="text-[10px] sm:text-xs">✦</span>
                                    <span className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-run-amber" />
                                </div>
                            </div>

                            {/* Bottom: Instrumentación y detalles sonoros */}
                            <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-geist-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-neutral-300">
                                <span>Trompetas</span>
                                <span className="text-run-amber">✦</span>
                                <span>Violines</span>
                                <span className="text-run-amber">✦</span>
                                <span>Guitarrón</span>
                                <span className="text-run-amber">✦</span>
                                <span>Voz y Corazón</span>
                            </div>
                        </div>
                    ) : a.ajuste === "contener" ? (
                        <>
                            {/* Fondo: la misma foto muy desenfocada, solo para rellenar los
                  lados. La foto de verdad va encima, completa. */}
                            <Image
                                src={a.foto}
                                alt=""
                                fill
                                sizes="(max-width: 1024px) 100vw, 65vw"
                                aria-hidden
                                className="scale-125 object-cover blur-2xl"
                            />
                            <div className="absolute inset-0 bg-black/25" />
                            <Image
                                src={a.foto}
                                alt={a.nombre}
                                fill
                                sizes="(max-width: 1024px) 100vw, 65vw"
                                className="object-contain"
                            />
                        </>
                    ) : (
                        <Image
                            src={a.foto}
                            alt={a.nombre}
                            fill
                            sizes="(max-width: 1024px) 100vw, 65vw"
                            className="object-cover"
                            style={{ objectPosition: a.enfoque ?? "center" }}
                        />
                    )}
                </div>
            ))}

            {hayVarios && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1.5 backdrop-blur-sm lg:bottom-5 lg:right-5">
                    <button
                        type="button"
                        onClick={() => ir(activo - 1)}
                        aria-label="Artista anterior"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                            <path d="M15.4 6 14 4.6 6.6 12 14 19.4 15.4 18 9.4 12z" />
                        </svg>
                    </button>

                    {artistas.map((a, i) => (
                        <button
                            key={a.nombre}
                            type="button"
                            onClick={() => ir(i)}
                            aria-label={`Ver a ${a.nombre}`}
                            aria-current={i === activo}
                            className="flex h-5 w-5 items-center justify-center"
                        >
                            <span
                                className={`block h-2 rounded-full bg-white transition-all ${i === activo ? "w-5" : "w-2 opacity-55"
                                    }`}
                            />
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => ir(activo + 1)}
                        aria-label="Artista siguiente"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                            <path d="M8.6 6 10 4.6 17.4 12 10 19.4 8.6 18 14.6 12z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}