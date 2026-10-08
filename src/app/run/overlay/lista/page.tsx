import Lista from "./Lista";

export const dynamic = "force-dynamic";

// /overlay/lista?key=SECRETO
// Opcionales:
//   &alcance=hoy|todo   filtro inicial (por defecto "hoy")
//   &controles=1        muestra el interruptor Hoy/Histórico (OBS > clic derecho > Interactuar)
//   &demo=1 · &privado=1 · &fondo=1
// Con el overlay enfocado, la tecla "T" alterna Hoy/Histórico.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Lista
      clave={sp.key}
      alcanceInicial={sp.alcance === "todo" ? "todo" : "hoy"}
      controles={sp.controles === "1"}
      demo={sp.demo === "1"}
      privado={sp.privado === "1"}
      fondo={sp.fondo === "1"}
    />
  );
}
