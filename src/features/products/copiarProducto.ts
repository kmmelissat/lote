import { aDolares, type DesgloseCosto } from "@/domain";
import type { Producto } from "./repositorio";

const dolares = (centavos: number) => aDolares(centavos).toFixed(2);

/**
 * Los valores con los que arranca el formulario de "otra igual": precio, costo, categoría, marca y
 * condición. El nombre, la descripción, la foto y la cantidad no se copian: cada pieza es distinta.
 */
export function valoresParaCopiar(p: Producto): Record<string, string> {
  const valores: Record<string, string> = { precio: dolares(p.precio), condicion: p.condicion };
  if (p.categoria) valores.categoria = p.categoria;
  if (p.marca) valores.marca = p.marca;
  for (const [tipo, monto] of Object.entries(p.desglose ?? {}) as [keyof DesgloseCosto, number][]) {
    if (monto) valores[tipo] = dolares(monto);
  }
  return valores;
}
