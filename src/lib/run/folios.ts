export const PREFIJO_FOLIO = "GG-";
// "GG-" + 5 dígitos
export const FOLIO_REGEX = /^GG-\d{5}$/;
export const FOLIO_MIN = 1;
export const FOLIO_MAX = 8000;

export type RangoFolio = { folioDesde: string; folioHasta: string };

export function formatFolio(n: number): string {
    return `${PREFIJO_FOLIO}${String(Math.trunc(n)).padStart(5, "0")}`;
}

export function numeroDeFolio(folio: string): number {
    const n = Number(folio.replace(PREFIJO_FOLIO, ""));
    return Number.isFinite(n) ? n : 0;
}

export function validarFormatoRango(r: RangoFolio): string | null {
    if (!r.folioDesde || !r.folioHasta) {
        return "Indica folio inicial y final";
    }
    if (!FOLIO_REGEX.test(r.folioDesde) || !FOLIO_REGEX.test(r.folioHasta)) {
        return "El folio debe tener el formato GG- seguido de 5 dígitos, por ejemplo GG-00001";
    }

    const desde = numeroDeFolio(r.folioDesde);
    const hasta = numeroDeFolio(r.folioHasta);

    if (desde < FOLIO_MIN || hasta > FOLIO_MAX) {
        return `El rango debe estar entre ${formatFolio(FOLIO_MIN)} y ${formatFolio(FOLIO_MAX)}`;
    }
    if (desde > hasta) {
        return "El folio inicial no puede ser mayor que el final";
    }
    return null;
}

function seTraslapan(a: RangoFolio, b: RangoFolio): boolean {
    return numeroDeFolio(a.folioDesde) <= numeroDeFolio(b.folioHasta) &&
        numeroDeFolio(b.folioDesde) <= numeroDeFolio(a.folioHasta);
}


export function validarSinTraslapesInternos(rangos: RangoFolio[]): string | null {
    for (let i = 0; i < rangos.length; i++) {
        const errorFormato = validarFormatoRango(rangos[i]);
        if (errorFormato) return errorFormato;

        for (let j = i + 1; j < rangos.length; j++) {
            if (seTraslapan(rangos[i], rangos[j])) {
                return `Los rangos ${rangos[i].folioDesde}–${rangos[i].folioHasta} y ${rangos[j].folioDesde}–${rangos[j].folioHasta} se traslapan entre sí`;
            }
        }
    }
    return null;
}