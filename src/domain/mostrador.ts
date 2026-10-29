import type { Centavos } from "./dinero";

export type Descuento = { tipo: "monto"; valor: Centavos } | { tipo: "porcentaje"; valor: number };

/**
 * Cuánto se descuenta de un subtotal. Un monto o un porcentaje (0 a 100); nunca pasa del subtotal
 * ni queda negativo, y el porcentaje se redondea al centavo.
 */
export function descuentoEnCentavos(subtotal: Centavos, descuento: Descuento | null): Centavos {
  if (!descuento || subtotal <= 0 || !Number.isFinite(descuento.valor) || descuento.valor <= 0) return 0;
  const bruto =
    descuento.tipo === "monto" ? Math.round(descuento.valor) : Math.round((subtotal * Math.min(descuento.valor, 100)) / 100);
  return Math.min(bruto, subtotal);
}

/** El total a cobrar: lo vendido menos el descuento. */
export function totalConDescuento(subtotal: Centavos, descuento: Descuento | null): Centavos {
  return subtotal - descuentoEnCentavos(subtotal, descuento);
}

/** El cambio a devolver cuando se paga en efectivo. Null si lo recibido no alcanza para el total. */
export function cambioDe(total: Centavos, recibido: Centavos): Centavos | null {
  return recibido >= total ? recibido - total : null;
}

export type CuadreDeCaja = {
  /** Lo que la caja debería tener: el efectivo con que arrancó más las ventas en efectivo */
  esperado: Centavos;
  /** Contado menos esperado: positivo sobra, negativo falta */
  diferencia: Centavos;
  estado: "cuadra" | "sobra" | "falta";
};

/** Compara el efectivo contado al cerrar con el que debía haber. */
export function cuadreDeCaja(entrada: { inicial: Centavos; ventasEnEfectivo: Centavos; contado: Centavos }): CuadreDeCaja {
  const esperado = entrada.inicial + entrada.ventasEnEfectivo;
  const diferencia = entrada.contado - esperado;
  return { esperado, diferencia, estado: diferencia === 0 ? "cuadra" : diferencia > 0 ? "sobra" : "falta" };
}

/**
 * Quita los espacios y los saltos de línea que algunos lectores agregan al final del código, y descarta
 * lo que no puede ser un código de barras (vacío o larguísimo). Null si no sirve.
 */
export function limpiarCodigoDeBarras(texto: string): string | null {
  const t = texto.replace(/[\r\n\t]/g, "").trim();
  return t.length >= 3 && t.length <= 64 ? t : null;
}
