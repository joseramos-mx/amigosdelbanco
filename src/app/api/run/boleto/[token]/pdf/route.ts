import { NextResponse } from "next/server";
import { TokenInvalido, boletoCompleto, boletoPorToken } from "@/lib/run/activacion";
import { generarBoletoPdf } from "@/lib/run/boleto-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Descarga del boleto en PDF.
 *
 * La autorización es la liga firmada: quien tiene el token del boleto es
 * quien lo compró o a quien se lo repartieron. No hace falta sesión, que es
 * justo lo que permite que el comprador de treinta lugares reparta ligas sin
 * que nadie tenga que crear una cuenta.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const resumen = await boletoPorToken(token);
    if (resumen.estado === "pendiente") {
      return NextResponse.json(
        { error: "El pago de este boleto todavía no se confirma." },
        { status: 409 },
      );
    }
    if (!resumen.activado_en) {
      return NextResponse.json(
        { error: "Primero hay que llenar los datos del corredor." },
        { status: 409 },
      );
    }

    const boleto = await boletoCompleto(resumen.id);
    if (!boleto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const pdf = await generarBoletoPdf(boleto);

    return new NextResponse(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boleto-${boleto.folio}.pdf"`,
        // El dorsal y los datos pueden cambiar hasta el día del evento.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof TokenInvalido) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[run/boleto/pdf]", err);
    return NextResponse.json({ error: "No pudimos generar el boleto." }, { status: 500 });
  }
}
