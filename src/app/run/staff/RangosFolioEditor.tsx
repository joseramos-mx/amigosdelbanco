"use client";

import { useState } from "react";
import {
    FOLIO_MIN,
    FOLIO_MAX,
    formatFolio,
    numeroDeFolio,
    validarFormatoRango,
    validarSinTraslapesInternos,
    type RangoFolio,
} from "@/lib/run/folios";

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function RangosFolioEditor({
    rangos,
    onChange,
}: {
    rangos: RangoFolio[];
    onChange: (rangos: RangoFolio[]) => void;
}) {
    const [agregando, setAgregando] = useState(false);
    const [nuevoDesde, setNuevoDesde] = useState("");
    const [nuevoHasta, setNuevoHasta] = useState("");
    const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

    const [editandoIndice, setEditandoIndice] = useState<number | null>(null);
    const [editDesde, setEditDesde] = useState("");
    const [editHasta, setEditHasta] = useState("");
    const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

    function agregarRango() {
        setErrorNuevo(null);

        const desde = Number(nuevoDesde);
        const hasta = Number(nuevoHasta);

        if (!nuevoDesde || !nuevoHasta || Number.isNaN(desde) || Number.isNaN(hasta) || desde <= 0 || hasta <= 0) {
            setErrorNuevo("Indica folio inicial y final, ambos mayores a cero");
            return;
        }

        const candidato: RangoFolio = { folioDesde: formatFolio(desde), folioHasta: formatFolio(hasta) };

        const errorConTodos = validarSinTraslapesInternos([...rangos, candidato]);
        if (errorConTodos) {
            setErrorNuevo(errorConTodos);
            return;
        }

        onChange([...rangos, candidato]);
        setNuevoDesde("");
        setNuevoHasta("");
        setAgregando(false);
    }

    function quitarRango(i: number) {
        onChange(rangos.filter((_, idx) => idx !== i));
        if (editandoIndice === i) cancelarEdicion();
    }

    function iniciarEdicion(i: number) {
        setAgregando(false);
        setEditandoIndice(i);
        setEditDesde(String(numeroDeFolio(rangos[i].folioDesde)));
        setEditHasta(String(numeroDeFolio(rangos[i].folioHasta)));
        setErrorEdicion(null);
    }

    function cancelarEdicion() {
        setEditandoIndice(null);
        setEditDesde("");
        setEditHasta("");
        setErrorEdicion(null);
    }

    function guardarEdicion(i: number) {
        setErrorEdicion(null);

        const desde = Number(editDesde);
        const hasta = Number(editHasta);

        if (!editDesde || !editHasta || Number.isNaN(desde) || Number.isNaN(hasta) || desde <= 0 || hasta <= 0) {
            setErrorEdicion("Indica folio inicial y final, ambos mayores a cero");
            return;
        }

        const candidato: RangoFolio = { folioDesde: formatFolio(desde), folioHasta: formatFolio(hasta) };

        // Se compara solo contra el resto de la lista: el propio rango que
        // se está editando no cuenta como "traslape consigo mismo".
        const restoDeLaLista = rangos.filter((_, idx) => idx !== i);
        const errorConTodos = validarSinTraslapesInternos([...restoDeLaLista, candidato]);
        if (errorConTodos) {
            setErrorEdicion(errorConTodos);
            return;
        }

        onChange(rangos.map((r, idx) => (idx === i ? candidato : r)));
        cancelarEdicion();
    }

    return (
        <div>
            <label className={`${etiqueta} block`}>Rangos de boletos</label>

            {rangos.length > 0 && (
                <ul className="mt-2 space-y-2">
                    {rangos.map((r, i) =>
                        editandoIndice === i ? (
                            <li
                                key={`${r.folioDesde}-${r.folioHasta}-${i}`}
                                className="rounded-lg border border-run-amber/30 bg-run-amber/5 p-4"
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={etiqueta}>Folio inicial</label>
                                        <div className="relative mt-2">
                                            <span
                                                className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-geist-mono text-xs text-white/40"
                                                style={{ left: "0.75rem" }}
                                            >
                                                GG-
                                            </span>
                                            <input
                                                type="number"
                                                min={FOLIO_MIN}
                                                max={FOLIO_MAX}
                                                value={editDesde}
                                                onChange={(e) => setEditDesde(e.target.value)}
                                                style={{ paddingLeft: "2.75rem" }}
                                                className={campo}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={etiqueta}>Folio final</label>
                                        <div className="relative mt-2">
                                            <span
                                                className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-geist-mono text-xs text-white/40"
                                                style={{ left: "0.75rem" }}
                                            >
                                                GG-
                                            </span>
                                            <input
                                                type="number"
                                                min={FOLIO_MIN}
                                                max={FOLIO_MAX}
                                                value={editHasta}
                                                onChange={(e) => setEditHasta(e.target.value)}
                                                style={{ paddingLeft: "2.75rem" }}
                                                className={campo}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {errorEdicion && <p className="mt-2 text-xs text-red-300">{errorEdicion}</p>}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => guardarEdicion(i)}
                                        className="rounded-md bg-run-amber px-4 py-2 text-xs uppercase tracking-wide text-black transition-opacity hover:opacity-85"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelarEdicion}
                                        className="rounded-md border border-white/15 px-4 py-2 text-xs uppercase tracking-wide text-white/60 transition-colors hover:border-white/30"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </li>
                        ) : (
                            <li
                                key={`${r.folioDesde}-${r.folioHasta}-${i}`}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-4 py-2.5"
                            >
                                <span className="font-geist-mono text-sm text-white">
                                    {r.folioDesde} – {r.folioHasta}
                                </span>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => iniciarEdicion(i)}
                                        className="font-geist-mono text-[11px] uppercase tracking-wide text-run-amber hover:opacity-80"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quitarRango(i)}
                                        className="font-geist-mono text-[11px] uppercase tracking-wide text-red-300 hover:opacity-80"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        )
                    )}
                </ul>
            )}

            {agregando ? (
                <div className="mt-3 rounded-lg border border-run-amber/30 bg-run-amber/5 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta}>Folio inicial</label>
                            <div className="relative mt-2">
                                <span
                                    className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-geist-mono text-xs text-white/40"
                                    style={{ left: "0.75rem" }}
                                >
                                    GG-
                                </span>
                                <input
                                    type="number"
                                    min={FOLIO_MIN}
                                    max={FOLIO_MAX}
                                    value={nuevoDesde}
                                    onChange={(e) => setNuevoDesde(e.target.value)}
                                    placeholder="00201"
                                    style={{ paddingLeft: "2.75rem" }}
                                    className={campo}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={etiqueta}>Folio final</label>
                            <div className="relative mt-2">
                                <span
                                    className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-geist-mono text-xs text-white/40"
                                    style={{ left: "0.75rem" }}
                                >
                                    GG-
                                </span>
                                <input
                                    type="number"
                                    min={FOLIO_MIN}
                                    max={FOLIO_MAX}
                                    value={nuevoHasta}
                                    onChange={(e) => setNuevoHasta(e.target.value)}
                                    placeholder="00250"
                                    style={{ paddingLeft: "2.75rem" }}
                                    className={campo}
                                />
                            </div>
                        </div>
                    </div>

                    {errorNuevo && <p className="mt-2 text-xs text-red-300">{errorNuevo}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={agregarRango}
                            className="rounded-md bg-run-amber px-4 py-2 text-xs uppercase tracking-wide text-black transition-opacity hover:opacity-85"
                        >
                            Agregar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAgregando(false);
                                setErrorNuevo(null);
                                setNuevoDesde("");
                                setNuevoHasta("");
                            }}
                            className="rounded-md border border-white/15 px-4 py-2 text-xs uppercase tracking-wide text-white/60 transition-colors hover:border-white/30"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        cancelarEdicion();
                        setAgregando(true);
                    }}
                    className="mt-3 font-geist-mono text-[11px] uppercase tracking-wide text-run-amber hover:opacity-80"
                >
                    + Agregar rango
                </button>
            )}
        </div>
    );
}