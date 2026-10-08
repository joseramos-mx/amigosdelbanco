import type { Metadata } from "next";
import { getLiveDonations } from "@/lib/queries";
import LiveDonantesFeed from "./LiveDonantesFeed";

export const metadata: Metadata = {
  title: "Historial de Donaciones — Social Run & Banco de Alimentos",
  description:
    "Historial de donaciones en tiempo real del Banco de Alimentos de Durango y Social Run 2026. Sigue minuto a minuto el impacto solidario.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RunDonantesPage() {
  const donations = await getLiveDonations(60);

  return <LiveDonantesFeed initialDonations={donations} />;
}
