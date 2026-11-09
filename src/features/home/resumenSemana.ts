import type { Centavos } from "@/domain/dinero";
import { formatearDolares } from "@/lib/formato";

export type DatosSemana = { vendido: Centavos; gastos: Centavos; ganancia: Centavos; pedidos: number; estimada: boolean };

/** Cómo se compara una cifra (dinero o conteo) con la semana pasada, en palabras y sin juzgar. null si no hay con qué comparar. */
export function compararCifra(
  actual: number,
  anterior: number | null,
  contra = "la semana pasada",
  formato: (n: number) => string = formatearDolares,
): { texto: string; corto: string; sube: boolean | null } | null {
  if (anterior === null) return null;
  if (actual === anterior) return { texto: `igual que ${contra}`, corto: "Igual", sube: null };
  // Con una base de cero o negativa un porcentaje no dice nada: se muestra la cifra
  if (anterior <= 0 || actual < 0) return { texto: `contra ${formato(anterior)} ${contra}`, corto: `Antes ${formato(anterior)}`, sube: actual > anterior };
  const pct = Math.round((Math.abs(actual - anterior) / anterior) * 100);
  if (pct === 0) return { texto: `igual que ${contra}`, corto: "Igual", sube: null };
  return { texto: `${pct} % ${actual > anterior ? "más" : "menos"} que ${contra}`, corto: `${actual > anterior ? "+" : "−"}${pct} %`, sube: actual > anterior };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dia = (f: string) => `${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]}`;

/** "3 – 9 nov" a partir de las fechas del periodo (hasta es exclusivo, así que se resta un día). */
export function rangoCorto(desdeFecha: string, hastaFecha: string): string {
  const ultimo = new Date(Date.parse(`${hastaFecha}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (ultimo === desdeFecha) return dia(desdeFecha);
  return desdeFecha.slice(5, 7) === ultimo.slice(5, 7) ? `${Number(desdeFecha.slice(8, 10))} – ${dia(ultimo)}` : `${dia(desdeFecha)} – ${dia(ultimo)}`;
}
