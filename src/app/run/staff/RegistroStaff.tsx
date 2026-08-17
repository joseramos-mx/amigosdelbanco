"use client";

import { useState } from "react";

type Rol = "admin" | "escaner" | "vendedor";

type Resultado = {
    correo: string;
    rol: Rol;
    contrasenaTemporal: string;
    folioDesde?: string;
    folioHasta?: string;
};

const PREFIJO_FOLIO = "GG-";
const FOLIO_MIN = 1;
const FOLIO_MAX = 8000;

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

function formatFolio(n: number) {
    return `${PREFIJO_FOLIO}${String(n).padStart(5, "0")}`;
}

export default function RegistroStaff() {
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rol, setRol] = useState<Rol>("escaner");
    const [folioDesde, setFolioDesde] = useState("");
    const [folioHasta, setFolioHasta] = useState("");

    const esVendedor = rol === "vendedor";

    async function registrar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (esVendedor) {
            const desde = Number(folioDesde);
            const hasta = Number(folioHasta);
            if (!desde || !hasta) {
                setError("Indica el rango de folios para este punto de venta");
                return;
            }
            if (desde < FOLIO_MIN || hasta > FOLIO_MAX) {
                setError(`El rango debe estar entre ${formatFolio(FOLIO_MIN)} y ${formatFolio(FOLIO_MAX)}`);
                return;
            }
            if (desde > hasta) {
                setError("El folio inicial no puede ser mayor que el final");
                return;
            }
        }

        setEnviando(true);
        setResultado(null);

        // Se guarda la referencia antes del await: React limpia currentTarget en
        // cuanto el handler regresa, así que usarlo después da null.
        const formulario = e.currentTarget;
        const datos = Object.fromEntries(new FormData(formulario).entries());

        const payload = esVendedor
            ? {
                ...datos,
                folioDesde: formatFolio(Number(folioDesde)),
                folioHasta: formatFolio(Number(folioHasta)),
            }
            : datos;

        try {
            const res = await fetch("/api/run/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const cuerpo = await res.json();
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo registrar");
            setResultado(cuerpo);
            formulario.reset();
            setRol("escaner");
            setFolioDesde("");
            setFolioHasta("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Algo salió mal");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <section className="mt-10">
            <h2 className={etiqueta}>Staff</h2>
            <div className="mt-4 rounded-xl border border-white/10 bg-run-card px-5 py-5">
                <p className="text-xs leading-relaxed text-white/40">
                    Da de alta a quien necesite entrar al panel, al escáner de kits o
                    vender en punto de venta. El rol{" "}
                    <strong className="text-white/60">admin</strong> ve el panel
                    completo; <strong className="text-white/60">escáner</strong> solo
                    puede entregar kits; <strong className="text-white/60">vendedor</strong>{" "}
                    vende folios dentro del rango que le asignes.
                </p>

                <form onSubmit={registrar} className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={etiqueta} htmlFor="nombre">
                                Nombre {esVendedor && <span className="normal-case text-white/30">(o establecimiento)</span>}
                            </label>
                            <input
                                id="nombre"
                                name="nombre"
                                required
                                className={`${campo} mt-2`}
                                placeholder={esVendedor ? "Farmacia Plaza Norte" : "Ana López"}
                            />
                        </div>
                        <div>
                            <label className={etiqueta} htmlFor="correo">Correo</label>
                            <input
                                id="correo"
                                name="correo"
                                type="email"
                                required
                                className={`${campo} mt-2`}
                                placeholder="ejemplo@gmail.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`${etiqueta} block`} htmlFor="rol">Rol</label>
                        <select
                            id="rol"
                            name="rol"
                            value={rol}
                            onChange={(e) => setRol(e.target.value as Rol)}
                            style={{ colorScheme: "dark" }}
                            className={`${campo} mt-2 sm:w-48`}
                        >
                            <option className="bg-run-card text-white" value="escaner">Escáner</option>
                            <option className="bg-run-card text-white" value="admin">Admin</option>
                            <option className="bg-run-card text-white" value="vendedor">Vendedor</option>
                        </select>
                    </div>

                    {esVendedor && (
                        <div className="rounded-lg border border-run-amber/30 bg-run-amber/5 p-4">
                            <p className={etiqueta}>Rango de folios a vender</p>
                            <p className="mt-1 text-xs text-white/40">
                                Del {formatFolio(FOLIO_MIN)} al {formatFolio(FOLIO_MAX)}. Este
                                vendedor solo podrá emitir folios dentro del rango que le des.
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label className={etiqueta} htmlFor="folioDesde">
                                        Folio desde
                                    </label>
                                    <div className="relative mt-2">
                                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-geist-mono text-sm text-white/40">
                                            {PREFIJO_FOLIO}
                                        </span>
                                        <input
                                            id="folioDesde"
                                            type="number"
                                            min={FOLIO_MIN}
                                            max={FOLIO_MAX}
                                            required={esVendedor}
                                            value={folioDesde}
                                            onChange={(e) => setFolioDesde(e.target.value)}
                                            className={`${campo} pl-11`}
                                            placeholder="00001"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={etiqueta} htmlFor="folioHasta">
                                        Folio hasta
                                    </label>
                                    <div className="relative mt-2">
                                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-geist-mono text-sm text-white/40">
                                            {PREFIJO_FOLIO}
                                        </span>
                                        <input
                                            id="folioHasta"
                                            type="number"
                                            min={FOLIO_MIN}
                                            max={FOLIO_MAX}
                                            required={esVendedor}
                                            value={folioHasta}
                                            onChange={(e) => setFolioHasta(e.target.value)}
                                            className={`${campo} pl-11`}
                                            placeholder="08000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                        {enviando ? "Registrando…" : "Registrar staff"}
                    </button>
                </form>

                {resultado && (
                    <div className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                        <p className="text-sm text-emerald-200">
                            Listo — <strong>{resultado.correo}</strong> ya puede entrar como{" "}
                            <strong>
                                {resultado.rol === "admin"
                                    ? "admin"
                                    : resultado.rol === "vendedor"
                                        ? "vendedor"
                                        : "escáner"}
                            </strong>
                            .
                        </p>
                        {resultado.rol === "vendedor" && resultado.folioDesde && resultado.folioHasta && (
                            <p className="mt-1 text-xs text-white/40">
                                Rango asignado: {resultado.folioDesde} – {resultado.folioHasta}
                            </p>
                        )}
                        <p className="mt-2 font-geist-mono text-[11px] text-run-amber">
                            Contraseña temporal: {resultado.contrasenaTemporal}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Compártesela por un canal seguro; se le pedirá cambiarla al entrar.
                        </p>
                    </div>
                )}

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
            </div>
        </section>
    );
}