"use server";
import { revalidatePath } from "next/cache";
import {
    capturarFisico,
    buscarVendedorPorFolio,
    type DatosCaptura,
} from "@/lib/run/captura-fisicos-admin";
import { paseActual } from "@/lib/run/staff";

export async function capturarFisicoAction(
    datos: DatosCaptura
): Promise<{ ok: true; ordenId: string } | { ok: false; error: string }> {
    try {
        const pase = await paseActual();
        if (!pase) throw new Error("No tienes sesión activa");

        const res = await capturarFisico(datos, pase.id);

        revalidatePath("/run/staff/admin");

        return { ok: true, ordenId: res.ordenId };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

export async function buscarVendedorPorFolioAction(
    folio: string
): Promise<
    | { ok: true; vendedor: { nombre: string } }
    | { ok: false; error?: string }
> {
    try {
        const pase = await paseActual();
        if (!pase) throw new Error("No tienes sesión activa");

        const vendedor = await buscarVendedorPorFolio(folio);

        if (!vendedor) {
            return { ok: false };
        }

        return { ok: true, vendedor: { nombre: vendedor.nombre } };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}