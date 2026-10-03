"use client";

import { useState } from "react";
import PanelArtista from "./PanelArtista";
import type { Mood } from "@/lib/run/moods";

/**
 * Una fila de la sección de moods: foto del artista + columna con el logo
 * grande y la descripción.
 *
 * Es componente de cliente porque la foto puede ser carrusel (Electrónica) y
 * el logo tiene que cambiar junto con ella. Por eso el artista activo vive
 * aquí y se comparte con los dos lados.
 *
 * La columna derecha son dos recuadros apilados: arriba el logo, que ocupa
 * todo el ancho para verse grande, y abajo el texto. El logo va en su propio
 * recuadro y no sobre la foto: así funciona igual con un PNG transparente que
 * con un JPG con fondo.
 */
export default function FilaMood({
    mood,
    invertida,
}: {
    mood: Mood;
    invertida: boolean;
}) {
    const [activo, setActivo] = useState(0);

    return (
        <div
            className={`grid gap-3 lg:h-[420px] lg:gap-4 ${invertida
                    ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]"
                    : "lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]"
                }`}
        >
            {/* ── Foto del artista ──────────────────────────────────────── */}
            <div
                className={`relative h-[240px] overflow-hidden rounded-[20px] sm:h-[320px] lg:h-full ${invertida ? "lg:order-2" : ""
                    }`}
            >
                <PanelArtista
                    artistas={mood.artistas}
                    activo={activo}
                    onCambiar={setActivo}
                />

                {mood.playlist && (
                    <a
                        href={mood.playlist}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escuchar una muestra de ${mood.nombre}`}
                        className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 lg:bottom-5 lg:left-5 lg:h-20 lg:w-20"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="ml-1 h-5 w-5 fill-black lg:h-7 lg:w-7"
                            aria-hidden
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </a>
                )}
            </div>

            {/* ── Columna: logo grande + descripción ────────────────────── */}
            <div
                className={`grid gap-3 lg:h-full lg:grid-rows-[190px_minmax(0,1fr)] lg:gap-4 ${invertida ? "lg:order-1" : ""
                    }`}
            >
                {/* Recuadro del logo.*/}
                <div className="relative h-[130px] overflow-hidden rounded-[20px] sm:h-[150px] lg:h-full">
                    {mood.artistas.map((a, i) => (
                        <div
                            key={a.nombre}
                            aria-hidden={i !== activo}
                            className={`absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-500 lg:p-8 ${i === activo ? "opacity-100" : "opacity-0"
                                }`}
                            style={{ background: a.fondoLogo ?? "#fff" }}
                        >
                            {a.logo ? (
                                <img
                                    src={a.logo}
                                    alt={a.nombre}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center rounded-[14px] border border-run-amber/30 bg-neutral-950/95 p-3 text-center select-none shadow-inner">
                                    {/* • INTERNACIONAL • */}
                                    <div className="flex items-center justify-center gap-1.5 text-run-amber font-schabo text-xs sm:text-sm lg:text-base uppercase tracking-[0.2em]">
                                        <span className="text-[7px]">●</span>
                                        <span className="text-white tracking-[0.18em]">
                                            INTERNACIONAL
                                        </span>
                                        <span className="text-[7px]">●</span>
                                    </div>

                                    {/* DURANGO in Rye */}
                                    <div className="relative my-0.5 w-full flex items-center justify-center">
                                        <div className="font-rye text-2xl sm:text-3xl lg:text-4xl tracking-wider text-run-amber uppercase leading-none drop-shadow-sm">
                                            DURANGO
                                        </div>
                                        <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-white/40 mix-blend-overlay" />
                                    </div>

                                    {/* —✦— MARIACHI —✦— */}
                                    <div className="flex items-center justify-center gap-1.5 text-run-amber">
                                        <span className="h-px w-5 bg-gradient-to-r from-transparent to-run-amber" />
                                        <span className="text-[7px]">✦</span>
                                        <span className="font-schabo text-[11px] sm:text-xs tracking-[0.25em] text-neutral-300 uppercase">
                                            MARIACHI
                                        </span>
                                        <span className="text-[7px]">✦</span>
                                        <span className="h-px w-5 bg-gradient-to-l from-transparent to-run-amber" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tarjeta con la descripción */}
                <div className="flex flex-col justify-center rounded-[20px] bg-[#E9A62D] px-7 py-6 lg:px-9 lg:py-5">
                    <div className="text-xl font-bold uppercase text-neutral-900">
                        Elige tu mood {mood.nombre}:
                    </div>
                    <p className="mt-1 text-[16px] leading-relaxed text-neutral-900 lg:text-[17px]">
                        {mood.descripcion}
                    </p>
                </div>
            </div>
        </div>
    );
}