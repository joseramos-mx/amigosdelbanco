"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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

function IconoEditar() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    );
}

function IconoEliminar() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}

function IconoHistorial() {
    return (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

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

    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
    const [pagina, setPagina] = useState(1);
    const POR_PAGINA = 5;

    const esVendedor = rol === "vendedor";

    const listaFiltrada = lista.filter((s) => {
        const term = filtroNombre.toLowerCase();
        const coincideNombre = (s.nombre || "").toLowerCase().includes(term) || (s.correo || "").toLowerCase().includes(term);
        const coincideRol = filtroRol === "todos" || s.rol === filtroRol;
        return coincideNombre && coincideRol;
    });

    const totalPaginas = Math.ceil(listaFiltrada.length / POR_PAGINA);
    const indiceInicio = (pagina - 1) * POR_PAGINA;
    const listaPaginada = listaFiltrada.slice(indiceInicio, indiceInicio + POR_PAGINA);

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
        <>
            <section className="mt-10">
                <h2 className={etiqueta}>Staff</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-run-card">
                    {cargandoLista ? (
                        <p className="px-5 py-6 text-xs text-white/40">Cargando…</p>
                    ) : lista.length === 0 ? (
                        <p className="px-5 py-6 text-xs text-white/40">Todavía no hay usuarios registrados.</p>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    value={filtroNombre}
                                    onChange={(e) => {
                                        setFiltroNombre(e.target.value);
                                        setPagina(1);
                                    }}
                                    className={`${campo} sm:max-w-xs`}
                                />
                                <select
                                    value={filtroRol}
                                    onChange={(e) => {
                                        setFiltroRol(e.target.value as Rol | "todos");
                                        setPagina(1);
                                    }}
                                    style={{ colorScheme: "dark" }}
                                    className={`${campo} sm:max-w-[160px]`}
                                >
                                    <option className="bg-run-card text-white" value="todos">Todos los roles</option>
                                    <option className="bg-run-card text-white" value="escaner">Escáner</option>
                                    <option className="bg-run-card text-white" value="admin">Admin</option>
                                    <option className="bg-run-card text-white" value="vendedor">Vendedor</option>
                                </select>
                            </div>

                            {listaFiltrada.length === 0 ? (
                                <p className="px-5 py-6 text-xs text-white/40">No hay usuarios que coincidan con la búsqueda.</p>
                            ) : (
                                <>
                                    {/* Móvil: tarjetas apiladas */}
                                    <ul className="divide-y divide-white/5 sm:hidden">
                                        {listaPaginada.map((s) => (
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

                                        <div className="mt-3 flex items-end justify-between gap-4">
                                            {s.rol === "vendedor" && s.rangos.length > 0 ? (
                                                <ul className="space-y-1 font-geist-mono text-[11px] text-white/50">
                                                    {s.rangos.map((r) => (
                                                        <li key={`${r.folioDesde}-${r.folioHasta}`}>
                                                            {r.folioDesde} a {r.folioHasta}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div />
                                            )}

                                            <div className="flex items-center gap-4">
                                                {s.rol === "vendedor" && (
                                                    <Link
                                                        href={`/run/staff/admin/vendedores/${s.id}`}
                                                        className="text-white/60 transition-colors hover:text-run-amber"
                                                        title="Historial de ventas"
                                                    >
                                                        <IconoHistorial />
                                                    </Link>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setEditando(s)}
                                                    className="text-run-amber transition-opacity hover:opacity-80"
                                                    title="Editar"
                                                >
                                                    <IconoEditar />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPorEliminar(s)}
                                                    className="text-red-300 transition-opacity hover:opacity-80"
                                                    title="Eliminar"
                                                >
                                                    <IconoEliminar />
                                                </button>
                                            </div>
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
                                        {listaPaginada.map((s) => (
                                            <tr key={s.id} className="border-b border-white/5 last:border-0">
                                                <td className="px-5 py-3 text-white">{s.nombre}</td>
                                                <td className="px-5 py-3 text-white/60">{s.correo}</td>
                                                <td className="px-5 py-3">
                                                    <span className="rounded-full border border-white/15 px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide text-white/60">
                                                        {ETIQUETA_ROL[s.rol]}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 font-geist-mono text-xs text-white/50">
                                                    {s.rol === "vendedor" && s.rangos.length > 0 ? (
                                                        <ul className="space-y-1">
                                                            {s.rangos.map((r) => (
                                                                <li key={`${r.folioDesde}-${r.folioHasta}`}>
                                                                    {r.folioDesde} a {r.folioHasta}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="px-5 py-3" style={{ textAlign: "right" }}>
                                                    <div className="flex items-center justify-end gap-4">
                                                        {s.rol === "vendedor" && (
                                                            <Link
                                                                href={`/run/staff/admin/vendedores/${s.id}`}
                                                                className="text-white/60 transition-colors hover:text-run-amber"
                                                                title="Historial de ventas"
                                                            >
                                                                <IconoHistorial />
                                                            </Link>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditando(s)}
                                                            className="text-run-amber transition-opacity hover:opacity-80"
                                                            title="Editar"
                                                        >
                                                            <IconoEditar />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPorEliminar(s)}
                                                            className="text-red-300 transition-opacity hover:opacity-80"
                                                            title="Eliminar"
                                                        >
                                                            <IconoEliminar />
                                                        </button>
                                                    </div>
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
                    </>
                )}
                </div>
            </section>

            <section className="mt-10">
                <h2 className={etiqueta}>Registro de Staff</h2>
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
                                    Nombre
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
            </section>

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
        </>
    );
}