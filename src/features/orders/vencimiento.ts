export type Urgencia = "normal" | "pronto" | "critica";

const HORA_MS = 3_600_000;

/** Qué tan urgente es un apartado según lo que le falta para vencer: neutro, ámbar (menos de 24 h) o rojo (menos de 3 h o vencido). */
export function urgenciaDeVencimiento(venceEn: Date, ahora: Date): Urgencia {
  const falta = venceEn.getTime() - ahora.getTime();
  if (falta < 3 * HORA_MS) return "critica";
  if (falta < 24 * HORA_MS) return "pronto";
  return "normal";
}
