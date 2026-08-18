"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import InfoDialog from "./InfoDialog";
import RangosFolioEditor from "./RangosFolioEditor";
import EditarStaffModal, { type StaffItem } from "./EditarStaffModal";
import { validarSinTraslapesInternos, type RangoFolio } from "@/lib/run/folios";

type Rol = "admin" | "escaner" | "vendedor";

type Resultado = {
    correo: string;
    rol: Rol;
    contrasenaTemporal: string;
    correoEnviado?: boolean;
    rangos?: RangoFolio[];
};

const campo =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white " +
    "placeholder:text-white/30 focus:border-run-amber focus:outline-none";
const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

const ETIQUETA_ROL: Record<Rol, string> = {
    admin: "Admin",
    escaner: "Escáner",
    vendedor: "Vendedor",
};

export default function RegistroStaff() {
    const formRef = useRef<HTMLFormElement>(null);

    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rol, setRol] = useState<Rol>("escaner");
    const [rangos, setRangos] = useState<RangoFolio[]>([]);

    const [datosPendientes, setDatosPendientes] = useState<{
        nombre: string;
        correo: string;
        rol: Rol;
        rangos: RangoFolio[];
    } | null>(null);
    const [resultadoExito, setResultadoExito] = useState<Resultado | null>(null);

    const [lista, setLista] = useState<StaffItem[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [editando, setEditando] = useState<StaffItem | null>(null);
    const [porEliminar, setPorEliminar] = useState<StaffItem | null>(null);
    const [eliminando, setEliminando] = useState(false);
    const [avisoEliminado, setAvisoEliminado] = useState(false);

    const esVendedor = rol === "vendedor";

    const cargarLista = useCallback(async () => {
        setCargandoLista(true);
        try {
            const res = await fetch("/api/run/staff");
            const cuerpo = await res.json().catch(() => ({}));
            if (res.ok) setLista(cuerpo.staff ?? []);
        } finally {
            setCargandoLista(false);
        }
    }, []);

    useEffect(() => {
        cargarLista();
    }, [cargarLista]);

    function prepararRegistro(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const datos = Object.fromEntries(new FormData(e.currentTarget).entries()) as {
            nombre: string;
            correo: string;
            rol: Rol;
        };

        if (esVendedor) {
            if (rangos.length === 0) {
                setError("Agrega al menos un rango de folios para este punto de venta");
                return;
            }
            const errorTraslapes = validarSinTraslapesInternos(rangos);
            if (errorTraslapes) {
                setError(errorTraslapes);
                return;
            }
        }

        setDatosPendientes({ ...datos, rangos: esVendedor ? rangos : [] });
    }

    async function confirmarRegistro() {
        if (!datosPendientes) return;
        setEnviando(true);
        setError(null);

        try {
            const res = await fetch("/api/run/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosPendientes),
            });
            const cuerpo = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo crear el usuario");
            setResultadoExito(cuerpo);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
        } finally {
            setEnviando(false);
            setDatosPendientes(null);
        }
    }

    function terminarRegistro() {
        setResultadoExito(null);
        formRef.current?.reset();
        setRol("escaner");
        setRangos([]);
        cargarLista();
    }

    async function confirmarEliminar() {
        if (!porEliminar) return;
        setEliminando(true);
        try {
            const res = await fetch(`/api/run/staff/${porEliminar.id}`, { method: "DELETE" });
            const cuerpo = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo eliminar el usuario");
            setPorEliminar(null);
            setAvisoEliminado(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario");
            setPorEliminar(null);
        } finally {
            setEliminando(false);
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
                    vende folios dentro de los rangos que le asignes.
                </p>

                <form ref={formRef} onSubmit={prepararRegistro} className="mt-5 space-y-4">
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
                            onChange={(e) => {
                                setRol(e.target.value as Rol);
                                setRangos([]);
                            }}
                            style={{ colorScheme: "dark" }}
                            className={`${campo} mt-2 sm:w-48`}
                        >
                            <option className="bg-run-card text-white" value="escaner">Escáner</option>
                            <option className="bg-run-card text-white" value="admin">Admin</option>
                            <option className="bg-run-card text-white" value="vendedor">Vendedor</option>
                        </select>
                    </div>

                    {esVendedor && (
                        <div className="rounded-lg border border-white/10 bg-white/2 p-4">
                            <RangosFolioEditor rangos={rangos} onChange={setRangos} />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-md bg-run-amber px-5 py-2.5 text-sm uppercase tracking-wide text-black transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                        Crear usuario
                    </button>
                </form>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-run-card">
                {cargandoLista ? (
                    <p className="px-5 py-6 text-xs text-white/40">Cargando…</p>
                ) : lista.length === 0 ? (
                    <p className="px-5 py-6 text-xs text-white/40">Todavía no hay usuarios registrados.</p>
                ) : (
                    <>
                        {/* Móvil: tarjetas apiladas */}
                        <ul className="divide-y divide-white/5 sm:hidden">
                            {lista.map((s) => (
                                <li key={s.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-white">{s.nombre}</p>
                                            <p className="mt-0.5 truncate text-xs text-white/50">{s.correo}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide text-white/60">
                                            {ETIQUETA_ROL[s.rol]}
                                        </span>
                                    </div>

                                    {s.rol === "vendedor" && s.rangos.length > 0 && (
                                        <p className="mt-2 font-geist-mono text-[11px] text-white/50">
                                            {s.rangos.map((r) => `${r.folioDesde}–${r.folioHasta}`).join(", ")}
                                        </p>
                                    )}

                                    <div className="mt-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setEditando(s)}
                                            style={{ marginRight: "1.25rem" }}
                                            className="font-geist-mono text-[11px] uppercase tracking-wide text-run-amber hover:opacity-80"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPorEliminar(s)}
                                            className="font-geist-mono text-[11px] uppercase tracking-wide text-red-300 hover:opacity-80"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Escritorio: tabla */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-160 text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Nombre</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Correo</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Rol</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`}>Rangos de boletos</th>
                                        <th className={`${etiqueta} px-5 py-3 font-normal`} style={{ textAlign: "right" }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lista.map((s) => (
                                        <tr key={s.id} className="border-b border-white/5 last:border-0">
                                            <td className="px-5 py-3 text-white">{s.nombre}</td>
                                            <td className="px-5 py-3 text-white/60">{s.correo}</td>
                                            <td className="px-5 py-3">
                                                <span className="rounded-full border border-white/15 px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide text-white/60">
                                                    {ETIQUETA_ROL[s.rol]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-geist-mono text-xs text-white/50">
                                                {s.rol === "vendedor" && s.rangos.length > 0
                                                    ? s.rangos.map((r) => `${r.folioDesde}–${r.folioHasta}`).join(", ")
                                                    : "—"}
                                            </td>
                                            <td className="px-5 py-3" style={{ textAlign: "right" }}>
                                                <div
                                                    className="flex flex-wrap items-center"
                                                    style={{
                                                        columnGap: "1rem",
                                                        rowGap: "0.5rem",
                                                        display: "flex",
                                                        justifyContent: "flex-end",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditando(s)}
                                                        style={{ marginRight: "1rem" }}
                                                        className="font-geist-mono text-[11px] uppercase tracking-wide text-run-amber hover:opacity-80"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setPorEliminar(s)}
                                                        className="font-geist-mono text-[11px] uppercase tracking-wide text-red-300 hover:opacity-80"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Paso 1: confirmar antes de crear */}
            <ConfirmDialog
                abierto={datosPendientes !== null}
                titulo="Confirmar registro"
                mensaje={
                    datosPendientes
                        ? `¿Estás seguro de que deseas crear este usuario?\n\nNombre: ${datosPendientes.nombre}\nCorreo: ${datosPendientes.correo}\nRol: ${ETIQUETA_ROL[datosPendientes.rol]}${datosPendientes.rangos.length > 0
                            ? `\nRangos: ${datosPendientes.rangos.map((r) => `${r.folioDesde}–${r.folioHasta}`).join(", ")}`
                            : ""
                        }`
                        : ""
                }
                textoConfirmar="Crear usuario"
                cargando={enviando}
                onConfirmar={confirmarRegistro}
                onCancelar={() => setDatosPendientes(null)}
            />

            {/* Paso 2: aviso de éxito, con la contraseña temporal que hay que repartir */}
            <InfoDialog
                abierto={resultadoExito !== null}
                titulo="Usuario creado correctamente"
                mensaje={
                    resultadoExito
                        ? `${resultadoExito.correo} ya puede entrar como ${ETIQUETA_ROL[resultadoExito.rol]}.\n\nContraseña temporal: ${resultadoExito.contrasenaTemporal}\n${resultadoExito.correoEnviado
                            ? "Ya le llegó por correo junto con la liga de inicio de sesión."
                            : "El correo no se pudo enviar; compártesela tú por un canal seguro."
                        }`
                        : ""
                }
                onAceptar={terminarRegistro}
            />

            {/* Eliminar: confirmar y luego avisar */}
            <ConfirmDialog
                abierto={porEliminar !== null}
                titulo="Eliminar usuario"
                mensaje={
                    porEliminar
                        ? `¿Estás seguro de que deseas eliminar este usuario?\n\nUsuario: ${porEliminar.nombre}\nCorreo: ${porEliminar.correo}\nRol: ${ETIQUETA_ROL[porEliminar.rol]}\n\nEsta acción no se puede deshacer.`
                        : ""
                }
                textoConfirmar="Eliminar"
                peligroso
                cargando={eliminando}
                onConfirmar={confirmarEliminar}
                onCancelar={() => setPorEliminar(null)}
            />
            <InfoDialog
                abierto={avisoEliminado}
                titulo="Listo"
                mensaje="Usuario eliminado correctamente."
                onAceptar={() => {
                    setAvisoEliminado(false);
                    cargarLista();
                }}
            />

            {editando && (
                <EditarStaffModal
                    staff={editando}
                    onCerrar={() => setEditando(null)}
                    onGuardado={() => {
                        setEditando(null);
                        cargarLista();
                    }}
                />
            )}
        </section>
    );
}