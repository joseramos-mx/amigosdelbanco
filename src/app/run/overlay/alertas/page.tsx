import Alertas from "./Alertas";

export const dynamic = "force-dynamic";

// /overlay/alertas?key=SECRETO            -> para OBS (Browser Source 1920x1080)
// Opcionales: &demo=1 (datos falsos) · &privado=1 ("Marina G.") · &fondo=1 (fondo negro para previsualizar)
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Alertas
      clave={sp.key}
      demo={sp.demo === "1"}
      privado={sp.privado === "1"}
      fondo={sp.fondo === "1"}
    />
  );
}
