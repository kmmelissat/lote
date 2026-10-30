/** Un número de página o un salto ("…") entre números que no van seguidos. */
export type Pagina = number | "salto";

/**
 * Los números de página a mostrar: siempre la primera y la última, la actual con sus vecinas, y "…" donde se saltan
 * páginas. Con pocas páginas van todas. Ej.: actual 6 de 12 → 1 … 5 6 7 … 12.
 */
export function paginasVisibles(actual: number, total: number, vecinas = 1): Pagina[] {
  if (total <= 1) return [1];
  const desde = Math.max(2, actual - vecinas);
  const hasta = Math.min(total - 1, actual + vecinas);
  const medio = Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => desde + i);
  // Un "…" que tapa una sola página no ahorra nada: mejor mostrarla
  const inicio: Pagina[] = desde === 3 ? [2] : desde > 3 ? ["salto"] : [];
  const fin: Pagina[] = hasta === total - 2 ? [total - 1] : hasta < total - 2 ? ["salto"] : [];
  return [1, ...inicio, ...medio, ...fin, total];
}

/** Qué productos se están mostrando: "25–48". */
export const rango = (pagina: number, porPagina: number, total: number) => ({
  desde: Math.min(total, (pagina - 1) * porPagina + 1),
  hasta: Math.min(total, pagina * porPagina),
});
