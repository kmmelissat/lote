import { esRubro, RUBROS, type RubroId } from "@/features/catalog/rubros";
import { LIMITE_CONTEXTO } from "@/features/catalog/marca";

// Lo que se pregunta al crear un negocio y cómo se vuelve datos. Es lógica pura: el formulario y la acción usan lo mismo.

import { esTrato, TRATO_POR_DEFECTO, TRATOS, type Trato } from "@/domain";

export { esTrato, TRATO_POR_DEFECTO, TRATOS, type Trato };

/** Cómo vende: cada canal prende o pide algo distinto. */
export const CANALES = ["instagram", "whatsapp", "facebook", "presencial"] as const;
export type Canal = (typeof CANALES)[number];
export const esCanal = (v: unknown): v is Canal => CANALES.includes(v as Canal);

/** Cuántos rubros se pueden elegir: con más, ya no dicen nada. */
export const MAXIMO_RUBROS = 3;
/** Lo que cuenta de su negocio: lo bastante largo para una descripción de verdad, y con lugar para "Vendo …" delante dentro de LIMITE_CONTEXTO */
export const LIMITE_FRASE = 900;
export const LIMITE_NOMBRE_PERSONA = 60;

/** Los rubros que llegaron del formulario: solo los que existen, sin repetir y hasta el máximo. */
export function rubrosValidos(crudos: readonly unknown[]): RubroId[] {
  return [...new Set(crudos.filter((r): r is string => typeof r === "string" && esRubro(r)))].slice(0, MAXIMO_RUBROS) as RubroId[];
}

/**
 * Lo que Lotito sabe del negocio desde el primer día: los rubros y la frase de la dueña juntos, en una sola línea y sin pasar
 * del límite del campo "Sobre tu tienda". Vacío si no dijo nada.
 */
export function contextoDeNegocio(rubros: readonly RubroId[], frase: string): string {
  const nombres = rubros.filter((r) => r !== "otros").map((r) => RUBROS.find((x) => x.id === r)!.nombre.toLowerCase());
  const queVende = nombres.length ? `Vendo ${nombres.join(", ").replace(/, ([^,]*)$/, " y $1")}.` : "";
  const libre = frase.trim().replace(/\s+/g, " ");
  return [queVende, libre].filter(Boolean).join(" ").slice(0, LIMITE_CONTEXTO);
}
