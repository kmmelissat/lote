import type { Centavos } from "./dinero";

/** Margen con el que arranca la sugerencia: de cada venta, el 40% queda de ganancia. */
export const MARGEN_POR_DEFECTO = 40;

const REDONDEO: Centavos = 50;

/**
 * Precio que deja `margenPct`% de ganancia sobre el precio de venta (no sobre el costo): con costo $6
 * y margen 40%, el precio es $10 y la ganancia $4, que es el 40% de $10. Se redondea hacia arriba a
 * los $0.50 para que el margen real nunca quede por debajo del pedido. Sin costo o con un margen
 * imposible (negativo, 100% o más) no hay sugerencia.
 *
 * Todo con enteros: una división con decimales puede dar 2000.0000000000002 y subir el precio sin motivo.
 */
export function precioSugerido(costo: Centavos, margenPct: number): Centavos | null {
  if (!Number.isFinite(margenPct) || costo <= 0) return null;
  const margen = Math.round(margenPct * 100); // centésimas de punto: 40 → 4000
  if (margen < 0 || margen >= 10_000) return null;
  return Math.ceil((costo * 10_000) / ((10_000 - margen) * REDONDEO)) * REDONDEO;
}
