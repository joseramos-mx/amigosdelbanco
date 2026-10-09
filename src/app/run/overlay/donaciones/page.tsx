import Efectivo from "./Efectivo";

export const dynamic = "force-dynamic";

// /overlay/efectivo?key=SECRETO
// Opcionales: &alcance=hoy (solo lo de hoy; por defecto muestra el total) · &demo=1 · &fondo=1
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Efectivo
      clave={sp.key}
      alcance={sp.alcance === "hoy" ? "hoy" : "todo"}
      demo={sp.demo === "1"}
      fondo={sp.fondo === "1"}
    />
  );
}
