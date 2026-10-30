/** Deja solo dígitos. Los montos aceptan un punto y hasta dos decimales; la coma cuenta como punto. */
export function soloNumero(valor: string, decimal: boolean): string {
  if (!decimal) return valor.replace(/\D/g, "");
  const limpio = valor.replace(/[^\d.,]/g, "").replace(",", ".");
  const corte = limpio.indexOf(".");
  if (corte === -1) return limpio;
  return `${limpio.slice(0, corte)}.${limpio.slice(corte + 1).replace(/\./g, "").slice(0, 2)}`;
}

export function limpiarSiNumero(valor: string, inputMode?: string, type?: string): string {
  if (inputMode === "decimal") return soloNumero(valor, true);
  if (inputMode === "numeric" || type === "number") return soloNumero(valor, false);
  return valor;
}
