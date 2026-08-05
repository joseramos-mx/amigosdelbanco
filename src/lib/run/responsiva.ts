import "server-only";

/**
 * Carta responsiva del Social Run.
 *
 * ⚠️ EL TEXTO DE ABAJO ES UN BORRADOR Y NO ESTÁ REVISADO POR UN ABOGADO.
 * Sirve para tener el mecanismo funcionando; antes de abrir venta al público
 * hay que sustituirlo por el que apruebe el área legal de la A.C. Cuando eso
 * pase, se agrega una entrada nueva a VERSIONES con otra `version` — nunca se
 * edita una existente.
 *
 * Ese versionado es el punto: se guarda en el boleto qué versión aceptó cada
 * persona, cuándo y desde qué IP. Si el texto cambia a mitad de la venta,
 * quien firmó antes conserva el que firmó. Es el respaldo legal del evento,
 * no una casilla decorativa.
 */

export type Responsiva = {
  version: string;
  vigenteDesde: string;
  titulo: string;
  parrafos: string[];
  borrador: boolean;
};

const VERSIONES: Responsiva[] = [
  {
    version: "borrador-2026-01",
    vigenteDesde: "2026-01-01",
    borrador: true,
    titulo: "Carta responsiva y deslinde de responsabilidad",
    parrafos: [
      "Declaro que participo en el Social Run 2026 de manera libre y voluntaria, por mi propia cuenta y riesgo.",
      "Manifiesto que me encuentro en buen estado de salud y que he sido evaluado por un médico para realizar esfuerzo físico de esta naturaleza. Asumo la responsabilidad de cualquier condición médica que no haya declarado.",
      "Libero a Banco de Alimentos de Durango A.C., a los organizadores, patrocinadores, voluntarios y autoridades participantes de toda responsabilidad por lesiones, accidentes, daños o pérdidas que pudiera sufrir antes, durante o después del evento.",
      "Autorizo a los servicios médicos del evento a brindarme atención de primeros auxilios y, de ser necesario, a trasladarme a un hospital, aceptando cubrir los gastos que ello genere.",
      "Autorizo el uso de mi imagen en fotografías y video captados durante el evento, con fines informativos y de difusión del proyecto, sin contraprestación alguna.",
      "Acepto el reglamento del evento y entiendo que la inscripción es personal e intransferible, y que no es reembolsable salvo lo que indique expresamente el reglamento.",
      "He leído y comprendido lo anterior, y lo acepto en su totalidad.",
    ],
  },
];

/** La versión vigente es siempre la última de la lista. */
export function responsivaVigente(): Responsiva {
  return VERSIONES[VERSIONES.length - 1];
}

export function responsivaPorVersion(version: string): Responsiva | null {
  return VERSIONES.find((r) => r.version === version) ?? null;
}
