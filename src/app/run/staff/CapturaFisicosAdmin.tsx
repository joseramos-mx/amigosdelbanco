"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    capturarFisicoAction,
    buscarVendedorPorFolioAction,
} from "./capturaFisicosActionsAdmin";
import type { MetodoPago } from "@/lib/run/captura-fisicos";

// Largo esperado del folio (sin el prefijo "GG-") antes de intentar
// buscar automáticamente al vendedor. Ajusta si tu folio es de otro tamaño.
const LARGO_FOLIO = 5;

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function CapturaFisicosAdmin() {
    const router = useRouter();

    const [folio, setFolio] = useState("");
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");
    const [tipoPago, setTipoPago] = useState<MetodoPago | "">("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado de la búsqueda automática del vendedor dueño del folio.
    // "idle": aún no hay suficientes dígitos para buscar.
    // "buscando": esperando respuesta del servidor.
    // "encontrado": ya sabemos quién vendió este folio.
    // "no-encontrado": el folio no está asignado a ningún vendedor.
    const [estadoVendedor, setEstadoVendedor] = useState<
        "idle" | "buscando" | "encontrado" | "no-encontrado"
    >("idle");
    const [vendedor, setVendedor] = useState<{ nombre: string } | null>(null);

    // Cada vez que el folio cambia y ya tiene el largo esperado, buscamos
    // al vendedor. Se usa un pequeño debounce para no disparar una petición
    // por cada tecla mientras el admin todavía está escribiendo.
    useEffect(() => {
        if (folio.length < LARGO_FOLIO) {
            setEstadoVendedor("idle");
            setVendedor(null);
            return;
        }

        let cancelado = false;
        setEstadoVendedor("buscando");

        const folioFormat = `GG-${folio.padStart(LARGO_FOLIO, "0")}`;
        const timeout = setTimeout(async () => {
            const res = await buscarVendedorPorFolioAction(folioFormat);
            if (cancelado) return;

            if (res.ok && res.vendedor) {
                setVendedor(res.vendedor);
                setEstadoVendedor("encontrado");
            } else {
                setVendedor(null);
                setEstadoVendedor("no-encontrado");
            }
        }, 400);

        return () => {
            cancelado = true;
            clearTimeout(timeout);
        };
    }, [folio]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (tipoPago === "") {
            setError("Selecciona el tipo de pago.");
            return;
        }

        if (estadoVendedor !== "encontrado") {
            setError("Verifica el folio: no se encontró un vendedor asignado a ese número.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        const folioFormat = `GG-${folio.padStart(5, "0")}`;

        const res = await capturarFisicoAction({
            folio: folioFormat,
            nombre,
            telefono,
            correo,
            tipoPago,
        });
        if (res.ok) {
            setSuccess(true);
            setFolio("");
            setNombre("");
            setTelefono("");
            setCorreo("");
            setTipoPago("");
            setVendedor(null);
            setEstadoVendedor("idle");
            router.refresh();
        } else {
            setError(res.error || "Error al capturar el folio.");
        }
        setLoading(false);
    };

    return (
        <section className="mt-10">
            <h2 className={etiqueta}>Captura de Boletos Físicos</h2>
            <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-5">
                <p className="text-xs leading-relaxed text-white/40">
                    Transcribe aquí los talones de papel que te entreguen los vendedores. Al capturarlos, el
                    sistema enviará automáticamente un correo al corredor para que pueda llenar su responsiva
                    médica, elegir su talla y descargar su boleto digital.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {error && <p className="text-sm text-red-300">{error}</p>}
                    {success && (
                        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                            <p className="text-sm text-emerald-200">
                                Boleto capturado con éxito. El correo de activación ya fue enviado al corredor.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta} htmlFor="folioFisico">Folio Físico</label>
                            <div className="mt-2 flex rounded-lg border border-white/15 bg-white/5 focus-within:border-run-amber transition-colors">
                                <span className="inline-flex items-center pl-4 pr-1 font-geist-mono text-sm text-white/50">
                                    GG-
                                </span>
                                <input
                                    id="folioFisico"
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    pattern="\d+"
                                    maxLength={5}
                                    value={folio}
                                    onChange={(e) => setFolio(e.target.value.replace(/\D/g, ""))}
                                    className="w-full bg-transparent py-2.5 pr-4 text-sm font-geist-mono text-white placeholder:text-white/30 focus:outline-none"
                                    placeholder="00001"
                                />
                            </div>
                            <p className="mt-1 font-geist-mono text-[9px] uppercase tracking-widest text-white/30">
                                Solo ingresa los números.
                            </p>

                            {estadoVendedor === "buscando" && (
                                <p className="mt-2 text-xs text-white/40">Buscando vendedor...</p>
                            )}

                            {estadoVendedor === "encontrado" && vendedor && (
                                <div className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                                    <p className="text-xs text-emerald-200">
                                        Vendedor: <span className="font-semibold">{vendedor.nombre}</span>
                                    </p>
                                </div>
                            )}

                            {estadoVendedor === "no-encontrado" && (
                                <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
                                    <p className="text-xs text-red-200">
                                        Ningún vendedor tiene asignado este folio. Verifica el número.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={etiqueta} htmlFor="nombreFisico">Nombre Completo del Corredor</label>
                            <input
                                id="nombreFisico"
                                type="text"
                                required
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={`${campo} mt-2`}
                                placeholder="Juan Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta} htmlFor="telefonoFisico">Teléfono del Corredor</label>
                            <input
                                id="telefonoFisico"
                                type="tel"
                                required
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className={`${campo} mt-2`}
                                placeholder="618..."
                            />
                        </div>

                        <div>
                            <label className={etiqueta} htmlFor="correoFisico">Correo Electrónico del Corredor</label>
                            <input
                                id="correoFisico"
                                type="email"
                                required
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                className={`${campo} mt-2`}
                                placeholder="juan@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta} htmlFor="tipoPagoFisico">Tipo de Pago</label>
                            <div className="relative mt-2">
                                <select
                                    id="tipoPagoFisico"
                                    required
                                    value={tipoPago}
                                    onChange={(e) => setTipoPago(e.target.value as MetodoPago | "")}
                                    className={`${campo} appearance-none pr-9 ${tipoPago === "" ? "text-white/30" : "text-white"}`}
                                >
                                    <option value="" disabled className="bg-run-card text-white/50">
                                        Selecciona una opción
                                    </option>
                                    <option value="efectivo" className="bg-run-card text-white">
                                        Efectivo
                                    </option>
                                    <option value="transferencia" className="bg-run-card text-white">
                                        Transferencia
                                    </option>
                                    <option value="deposito" className="bg-run-card text-white">
                                        Depósito
                                    </option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
                                    ▾
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || estadoVendedor !== "encontrado"}
                            className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                        >
                            {loading ? "Capturando..." : "Capturar e Invitar"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}