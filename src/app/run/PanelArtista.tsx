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
                    {a.ajuste === "contener" ? (
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