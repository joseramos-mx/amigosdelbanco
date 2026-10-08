import { NextResponse } from "next/server";
import { getTotals, getLiveDonations } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [totals, donations] = await Promise.all([
      getTotals(),
      getLiveDonations(60),
    ]);

    return NextResponse.json(
      {
        totals,
        donations,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[/api/donantes/live] Error al consultar datos:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los datos en vivo" },
      { status: 500 }
    );
  }
}
