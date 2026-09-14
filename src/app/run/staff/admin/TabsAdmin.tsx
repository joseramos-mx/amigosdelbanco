"use client";

import { useState, ReactNode } from "react";

type Tab = "ventas" | "staff" | "acciones" | "cortesias" | "exportaciones";

export default function TabsAdmin({
  ventas,
  staff,
  acciones,
  cortesias,
  exportaciones,
}: {
  ventas: ReactNode;
  staff: ReactNode;
  acciones: ReactNode;
  cortesias: ReactNode;
  exportaciones: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("ventas");

  const tabs: { id: Tab; label: string }[] = [
    { id: "ventas", label: "Ventas" },
    { id: "staff", label: "Staff" },
    { id: "acciones", label: "Acciones" },
    { id: "cortesias", label: "Cortesías" },
    { id: "exportaciones", label: "Exportaciones" },
  ];

  return (
    <div className="mt-8">
      {/* Navegación de pestañas */}
      <div className="flex space-x-1 border-b border-white/10 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-5 py-3 text-sm uppercase tracking-wide font-geist-mono transition-colors rounded-t-lg ${
              activeTab === tab.id
                ? "bg-run-card border-t border-x border-white/10 text-run-amber"
                : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
            }`}
            style={{
              marginBottom: activeTab === tab.id ? "-1px" : "0",
              borderBottomColor: activeTab === tab.id ? "#131313" : "transparent" // Asumiendo color de fondo de página para tapar el borde
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      <div className="mt-6">
        <div className={activeTab === "ventas" ? "block animate-in fade-in duration-300" : "hidden"}>
          {ventas}
        </div>
        <div className={activeTab === "staff" ? "block animate-in fade-in duration-300" : "hidden"}>
          {staff}
        </div>
        <div className={activeTab === "acciones" ? "block animate-in fade-in duration-300" : "hidden"}>
          {acciones}
        </div>
        <div className={activeTab === "cortesias" ? "block animate-in fade-in duration-300" : "hidden"}>
          {cortesias}
        </div>
        <div className={activeTab === "exportaciones" ? "block animate-in fade-in duration-300" : "hidden"}>
          {exportaciones}
        </div>
      </div>
    </div>
  );
}
