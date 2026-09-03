import Link from "next/link";
import BotonSalir from "../../../BotonSalir";
import HistorialClient from "./HistorialClient";
import { foliosCapturadosPorVendedor } from "@/lib/run/captura-fisicos";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { paseActual } from "@/lib/run/staff";
import { resumen } from "@/lib/run/padron";
import { EVENTO_SLUG } from "@/lib/run/inscripciones";

export const dynamic = "force-dynamic";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
    return (
        <div className="rounded-[20px] border border-white/10 bg-run-card px-5 py-4">
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                {etiqueta}
            </p>
            <p className="mt-2 font-schabo text-4xl uppercase leading-none text-white">
                {valor}
            </p>
        </div>
    );
}

export default async function HistorialVendedorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const pase = await paseActual();
    if (pase?.rol !== "admin") return redirect("/run/staff");

    const sql = db();
    const [vendedor] = await sql<{ nombre: string; correo: string; rol: string }[]>`
        select nombre, correo, rol from public.usuario_rol where id = ${id}
    `;

    if (!vendedor) {
        return (
            <main className="min-h-svh px-4 py-8 sm:px-6 lg:px-10">
                <p className="text-white">Vendedor no encontrado.</p>
            </main>
        );
    }

    const rangos = await sql<{ folio_desde: string; folio_hasta: string }[]>`
        select folio_desde, folio_hasta from public.vendedor_rango where vendedor_id = ${id} order by folio_desde asc
    `;

    const datos = await resumen(EVENTO_SLUG);
    const boletos = await foliosCapturadosPorVendedor(id);

    const totales = boletos.length;
    const vendidos = boletos.filter(b => b.estado !== "pendiente").length;
    const disponibles = boletos.filter(b => b.estado === "pendiente").length;

    const fecha = datos
        ? new Intl.DateTimeFormat("es-MX", {
            dateStyle: "full",
            timeZone: "America/Monterrey",
        }).format(datos.evento.fecha_carrera)
        : "";

    const etiqueta = "font-geist-mono text-[10px] uppercase tracking-[0.18em] text-white/40";

    return (
        <main className="min-h-svh px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                        <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
                            Historial de Ventas
                        </h1>
                        <p className="mt-2 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                            {vendedor.nombre} {datos && `· ${fecha}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/run/staff/admin"
                            className="rounded bg-run-amber px-4 py-2 font-geist-mono text-[10px] uppercase tracking-widest text-black transition hover:opacity-90"
                        >
                            Volver al panel
                        </Link>
                    </div>
                </div>

                {/* Info del vendedor */}
                <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-run-card">
                    {/* Móvil */}
                    <div className="px-5 py-4 sm:hidden">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm text-white">{vendedor.nombre}</p>
                                <p className="mt-0.5 truncate text-xs text-white/50">{vendedor.correo}</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide text-white/60">
                                VENDEDOR
                            </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-4">
                            {rangos.length > 0 ? (
                                <ul className="space-y-1 font-geist-mono text-[11px] text-white/50">
                                    {rangos.map((r) => (
                                        <li key={`${r.folio_desde}-${r.folio_hasta}`}>
                                            {r.folio_desde} a {r.folio_hasta}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="font-geist-mono text-[11px] text-white/50">—</span>
                            )}
                        </div>
                    </div>

                    {/* Escritorio */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-160 text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className={`${etiqueta} px-5 py-3 font-normal`}>Vendedor</th>
                                    <th className={`${etiqueta} px-5 py-3 font-normal`}>Correo</th>
                                    <th className={`${etiqueta} px-5 py-3 font-normal`}>Rol</th>
                                    <th className={`${etiqueta} px-5 py-3 font-normal`}>Rangos de boletos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5 last:border-0">
                                    <td className="px-5 py-4 text-white">{vendedor.nombre}</td>
                                    <td className="px-5 py-4 text-white/60">{vendedor.correo}</td>
                                    <td className="px-5 py-4">
                                        <span className="rounded-full border border-white/15 px-2.5 py-1 font-geist-mono text-[10px] uppercase tracking-wide text-white/60">
                                            VENDEDOR
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-geist-mono text-xs text-white/50">
                                        {rangos.length > 0 ? (
                                            <ul className="space-y-1">
                                                {rangos.map((r) => (
                                                    <li key={`${r.folio_desde}-${r.folio_hasta}`}>
                                                        {r.folio_desde} a {r.folio_hasta}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Dato etiqueta="Total Boletos" valor={totales} />
                    <Dato etiqueta="Vendidos" valor={vendidos} />
                    <Dato etiqueta="Disponibles" valor={disponibles} />
                </div>

                <HistorialClient boletos={boletos} />
            </div>
        </main>
    );
}
