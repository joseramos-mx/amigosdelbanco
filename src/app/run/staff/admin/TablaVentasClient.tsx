"use client";

import { useState } from "react";

type BoletoRow = {
  folio: string;
  vendedor: string;
  tipo_boleto: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: string;
  correo: string;
  telefono: string;
  talla_playera: string;
  club: string;
  contacto_emerg_nombre: string;
  contacto_emerg_tel: string;
  tipo_sangre: string;
  condiciones_medicas: string;
  categoria: string;
  dorsal: string | number;
  mood: string;
};

export default function TablaVentasClient({ boletos }: { boletos: BoletoRow[] }) {
  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroMood, setFiltroMood] = useState("Todos");
  const [filtroTalla, setFiltroTalla] = useState("Todas");
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 20;

  // Opciones fijas según el negocio
  const tiposUnicos = ["Digital", "Físico", "Cortesía"];
  const moodsUnicos = ["rave", "ska", "oldies", "ranchero"];
  const tallasUnicas = ["XS", "S", "M", "L", "XL", "XXL"];

  const filtrados = boletos.filter((b) => {
    const coincideFolio = b.folio.toLowerCase().includes(filtroFolio.toLowerCase());
    const coincideVendedor = b.vendedor.toLowerCase().includes(filtroVendedor.toLowerCase());
    const coincideTipo = filtroTipo === "Todos" || b.tipo_boleto === filtroTipo;
    const coincideMood = filtroMood === "Todos" || b.mood === filtroMood;
    const coincideTalla = filtroTalla === "Todas" || b.talla_playera === filtroTalla;

    return coincideFolio && coincideVendedor && coincideTipo && coincideMood && coincideTalla;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const indiceInicio = (pagina - 1) * POR_PAGINA;
  const paginaActual = filtrados.slice(indiceInicio, indiceInicio + POR_PAGINA);

  // Reiniciar la página al cambiar filtros
  const handleFiltroCambio = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPagina(1);
  };

  const th = "px-4 py-3 font-normal whitespace-nowrap";
  const td = "px-4 py-3 whitespace-nowrap";
  const campo = "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-run-amber focus:outline-none";

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Buscar folio..."
          value={filtroFolio}
          onChange={handleFiltroCambio(setFiltroFolio)}
          className={`${campo} sm:w-40`}
        />

        <input
          type="text"
          placeholder="Buscar vendedor..."
          value={filtroVendedor}
          onChange={handleFiltroCambio(setFiltroVendedor)}
          className={`${campo} sm:w-40`}
        />

        <select
          value={filtroTipo}
          onChange={handleFiltroCambio(setFiltroTipo)}
          style={{ colorScheme: "dark" }}
          className={`${campo} sm:w-40`}
        >
          <option className="bg-run-card text-white" value="Todos">Tipos: Todos</option>
          {tiposUnicos.map(t => (
            <option key={t} className="bg-run-card text-white" value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filtroMood}
          onChange={handleFiltroCambio(setFiltroMood)}
          style={{ colorScheme: "dark" }}
          className={`${campo} sm:w-40`}
        >
          <option className="bg-run-card text-white" value="Todos">Mood: Todos</option>
          {moodsUnicos.map(m => (
            <option key={m} className="bg-run-card text-white" value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filtroTalla}
          onChange={handleFiltroCambio(setFiltroTalla)}
          style={{ colorScheme: "dark" }}
          className={`${campo} sm:w-40`}
        >
          <option className="bg-run-card text-white" value="Todas">Talla: Todas</option>
          {tallasUnicas.map(t => (
            <option key={t} className="bg-run-card text-white" value={t}>{t}</option>
          ))}
        </select>

        <div className="ml-auto text-xs text-white/40">
          Mostrando {filtrados.length} de {boletos.length}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-run-card">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-white/10 font-geist-mono text-[10px] uppercase tracking-wider text-white/50">
            <tr>
              <th className={th}>Folio</th>
              <th className={th}>Vendedor</th>
              <th className={th}>Tipo</th>
              <th className={th}>Corredor</th>
              <th className={th}>Apellidos</th>
              <th className={th}>Fecha Nacimiento</th>
              <th className={th}>Sexo</th>
              <th className={th}>Correo</th>
              <th className={th}>Teléfono</th>
              <th className={th}>Talla Playera</th>
              <th className={th}>Club</th>
              <th className={th}>Nombre Emergencia</th>
              <th className={th}>Tel. Emergencia</th>
              <th className={th}>Tipo Sangre</th>
              <th className={th}>Condiciones Médicas</th>
              <th className={th}>Categoría</th>
              <th className={th}>Dorsal</th>
              <th className={th}>Mood</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginaActual.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-4 py-8 text-center text-white/40">
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              paginaActual.map((b, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className={`${td} font-mono text-run-amber`}>{b.folio}</td>
                  <td className={`${td} ${b.vendedor ? "text-cyan-400 font-medium" : "text-white/30"}`}>
                    {b.vendedor || "-"}
                  </td>
                  <td className={td}>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 font-geist-mono text-[9px] uppercase tracking-wide">
                      {b.tipo_boleto}
                    </span>
                  </td>
                  <td className={td}>{b.nombre || "-"}</td>
                  <td className={td}>{b.apellidos || "-"}</td>
                  <td className={td}>{b.fecha_nacimiento || "-"}</td>
                  <td className={td}>{b.sexo || "-"}</td>
                  <td className={td}>{b.correo || "-"}</td>
                  <td className={td}>{b.telefono || "-"}</td>
                  <td className={td}>{b.talla_playera || "-"}</td>
                  <td className={td}>{b.club || "-"}</td>
                  <td className={td}>{b.contacto_emerg_nombre || "-"}</td>
                  <td className={td}>{b.contacto_emerg_tel || "-"}</td>
                  <td className={td}>{b.tipo_sangre || "-"}</td>
                  <td className={td}>{b.condiciones_medicas || "-"}</td>
                  <td className={td}>{b.categoria || "-"}</td>
                  <td className={td}>{b.dorsal || "-"}</td>
                  <td className={td}>{b.mood || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
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
      </div>
    </>
  );
}
