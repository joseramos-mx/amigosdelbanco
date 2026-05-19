import type { Metadata } from "next";
import ProgressView from "./ProgressView";

export const metadata: Metadata = {
  title: "Progreso — Banco de Alimentos",
  description: "Avance de obra de la nueva sede del Banco de Alimentos de Durango.",
};

export default function ProgresoPage() {
  return <ProgressView />;
}
