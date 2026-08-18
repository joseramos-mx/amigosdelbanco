"use client";

import { useState } from "react";
import RangosFolioEditor from "./RangosFolioEditor";
import InfoDialog from "./InfoDialog";
import { validarSinTraslapesInternos, type RangoFolio } from "@/lib/run/folios";

type Rol = "admin" | "escaner" | "vendedor";

export type StaffItem = {
    id: string;
    nombre: string;
    correo: string;
    rol: Rol;
    rangos: (RangoFolio & { id: string })[];
};

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

export default function EditarStaffModal({
    staff,
    onCerrar,
    onGuardado,
}: {
    staff: StaffItem;
    onCerrar: () => void;
    onGuardado: () => void;
}) {
    const esVendedor = staff.rol === "vendedor";

    const [nombre, setNombre] = useState(staff.nombre);
    const [rangos, setRangos] = useState<RangoFolio[]>(
        staff.rangos.map((r) => ({ folioDesde: r.folioDesde, folioHasta: r.folioHasta }))
    );
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState(false);

    async function guardar() {
        setError(null);

        if (!nombre.trim()) {
            setError("Falta el nombre");
            return;
        }

        const payload: Record<string, unknown> = { nombre: nombre.trim() };

        if (esVendedor) {
            if (rangos.length === 0) {
                setError("Este vendedor necesita al menos un rango de folios");
                return;
            }
            const errorTraslapes = validarSinTraslapesInternos(rangos);
            if (errorTraslapes) {
                setError(errorTraslapes);
                return;
            }
            payload.rangos = rangos;
        }

        setGuardando(true);
        try {
            const res = await fetch(`/api/run/staff/${staff.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const cuerpo = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudieron guardar los cambios");
            setExito(true);
        } catch (err) {
            // Mantenemos el modal abierto con lo que el admin ya había
            // escrito: no se pierde nada si falla.
            setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios");
        } finally {
            setGuardando(false);
        }
    }

    if (exito) {
        return (
            <InfoDialog
                abierto
                titulo="Listo"
                mensaje="Los cambios se guardaron correctamente."
                onAceptar={onGuardado}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={onCerrar}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-run-card p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-schabo text-2xl uppercase leading-none text-white">
                    Editar usuario
                </h3>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className={`${etiqueta} block`} htmlFor="nombre-editar">
                            Nombre
                        </label>
                        <input
                            id="nombre-editar"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className={`${campo} mt-2`}
                        />
                    </div>

                    <div>
                        <label className={`${etiqueta} block`}>Correo electrónico</label>
                        <p className="mt-2 rounded-lg border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white/40">
                            {staff.correo} <span className="text-white/25">— no editable</span>
                        </p>
                    </div>

                    <div>
                        <label className={`${etiqueta} block`}>Rol</label>
                        <p className="mt-2 rounded-lg border border-white/10 bg-white/3 px-4 py-2.5 text-sm text-white/40">
                            {staff.rol}
                        </p>
                    </div>

                    {esVendedor && <RangosFolioEditor rangos={rangos} onChange={setRangos} />}

                    {error && <p className="text-sm text-red-300">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={guardando}
                        className="rounded-md border border-white/15 px-4 py-2 text-sm uppercase tracking-wide text-white/70 transition-colors hover:border-white/30 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={guardando}
                        className="rounded-md bg-run-amber px-4 py-2 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                        {guardando ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}