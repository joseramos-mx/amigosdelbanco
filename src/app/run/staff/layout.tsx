import { redirect } from "next/navigation";
import { paseActual } from "@/lib/run/staff";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Guardia del área de equipo: toda ruta bajo /run/staff pasa por aquí.
 *
 * La pantalla de pase inválido vive fuera del área a propósito. Colgándola
 * del mismo layout, el guardia la bloquearía también y el navegador quedaría
 * rebotando en círculos.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const pase = await paseActual();
  if (!pase) redirect("/run/pase-invalido");
  return <>{children}</>;
}
