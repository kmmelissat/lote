import type { TipoPeriodo } from "@/domain";

// El mes pasado es el mes de siempre, corrido uno hacia atrás.
export const PERIODOS = {
  dia: { tipo: "dia", desplazar: 0 },
  semana: { tipo: "semana", desplazar: 0 },
  mes: { tipo: "mes", desplazar: 0 },
  mesPasado: { tipo: "mes", desplazar: -1 },
} as const satisfies Record<string, { tipo: TipoPeriodo; desplazar: number }>;

export type ClavePeriodo = keyof typeof PERIODOS;
export const CLAVES_PERIODO = Object.keys(PERIODOS) as ClavePeriodo[];
export const esClavePeriodo = (s: string): s is ClavePeriodo => CLAVES_PERIODO.includes(s as ClavePeriodo);
