"use client";

import { useState } from "react";
import type { BoletoCapturado } from "@/lib/run/captura-fisicos";

const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";
const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";

export default function BoletosCapturadosClient({ boletos }: { boletos: BoletoCapturado[] }) {
    const [filtroFolio, setFiltroFolio] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<string>("todos");
    const [pagina, setPagina] = useState(1);
    const POR_PAGINA = 5;

    const estadosDisponibles = Array.from(new Set(boletos.map(b => b.estado))).filter(Boolean);

    const filtrados = boletos.filter((b) => {
        const coincideFolio = b.folio?.toLowerCase().includes(filtroFolio.toLowerCase());
        const coincideEstado = filtroEstado === "todos" || b.estado === filtroEstado;
        return coincideFolio && coincideEstado;
    }).sort((a, b) => a.folio.localeCompare(b.folio));

    const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
    const indiceInicio = (pagina - 1) * POR_PAGINA;
    const boletosPaginados = filtrados.slice(indiceInicio, indiceInicio + POR_PAGINA);

    const etiquetaEstado = (estado: string) => {
        const est = estado.toLowerCase();
        if (est === "pendiente") return "Disponible";
        if (est === "pagada" || est === "pagado") return "Pagado";
        return estado.charAt(0).toUpperCase() + estado.slice(1);
    };

    const colorEstado = (estado: string) => {
        switch (estado.toLowerCase()) {
            case "pagada":
            case "pagado":
                return "text-run-amber border-run-amber/20 bg-run-amber/10";
            case "cancelada":
            case "cancelado":
            case "expirada":
                return "text-red-400 border-red-400/20 bg-red-400/10";
            case "pendiente":
                return "text-green-400 border-green-400/20 bg-green-400/10";
            default:
                return "text-white/60 border-white/15 bg-white/5";
        }
    };

    return (
        <section className="mt-10">
            <h2 className={etiqueta}>Boletos Capturados ({boletos.length})</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-run-card">
                <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                    <input
                        type="text"
                        placeholder="Buscar por folio..."
                        value={filtroFolio}
                        onChange={(e) => {
                            setFiltroFolio(e.target.value);
                            setPagina(1);
                        }}
                        className={`${campo} sm:max-w-xs`}
                    />
                    <select
                        value={filtroEstado}
                        onChange={(e) => {
                            setFiltroEstado(e.target.value);
                            setPagina(1);
                        }}
                        style={{ colorScheme: "dark" }}
                        className={`${campo} sm:max-w-40`}
                    >
                        <option className="bg-run-card text-white" value="todos">Todos los estados</option>
                        {estadosDisponibles.map((est) => (
                            <option key={est} className="bg-run-card text-white" value={est}>
                                {etiquetaEstado(est)}
                            </option>
                        ))}
                    </select>
                </div>

                {filtrados.length === 0 ? (
                    <p className="px-5 py-6 text-xs text-white/40">
                        {boletos.length === 0
                            ? "Aún no has capturado ningún boleto físico."
                            : "No hay boletos que coincidan con la búsqueda."}
                    </p>
                ) : (
                    <>
                        {/* Móvil: tarjetas apiladas */}
                        <ul className="divide-y divide-white/5 sm:hidden">
                            {boletosPaginados.map((b) => (
                                <li key={b.folio} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-geist-mono text-sm uppercase text-white">{b.folio}</p>
                                            <p className="mt-1 truncate text-sm text-white/80">{b.nombre_comprador}</p>
                                            <p className="mt-0.5 truncate text-xs text-white/50">{b.correo_comprador}</p>
                                            <p className="mt-0.5 truncate text-xs text-white/50">{b.telefono || "-"}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide ${colorEstado(b.estado)}`}>
                                            {etiquetaEstado(b.estado)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Escritorio: tabla */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-160 text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Folio</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Comprador</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {boletosPaginados.map((b) => (
                                        <tr key={b.folio} className="border-b border-white/5 last:border-0">
                                            <td className="px-5 py-3 font-geist-mono text-white">{b.folio}</td>
                                            <td className="px-5 py-3">
                                                <p className="text-white/90">{b.nombre_comprador}</p>
                                                <p className="text-xs text-white/50">{b.correo_comprador}</p>
                                                <p className="text-xs text-white/50">{b.telefono || "-"}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full border px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide ${colorEstado(b.estado)}`}>
                                                    {etiquetaEstado(b.estado)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Controles de paginación */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                                <button
                                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                                    disabled={pagina === 1}
                                    className="cursor-pointer font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white disabled:cursor-default disabled:opacity-50 disabled:hover:text-white/60"
                                >
                                    Anterior
                                </button>
                                <span className="font-geist-mono text-xs text-white/40">
                                    Página {pagina} de {totalPaginas}
                                </span>
                                <button
                                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                                    disabled={pagina === totalPaginas}
                                    className="cursor-pointer font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white disabled:cursor-default disabled:opacity-50 disabled:hover:text-white/60"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}