import type { Centavos } from "./dinero";
import { descuentoEnCentavos, type Descuento } from "./mostrador";

export type EstadoOferta = "programada" | "activa" | "terminada";

/**
 * El precio que queda con la oferta: el normal menos el monto o el porcentaje. Null si no rebaja nada o lo dejaría en
 * $0 (una oferta tiene que bajar el precio sin regalar el producto).
 */
export function precioDeOferta(precio: Centavos, descuento: Descuento): Centavos | null {
  const rebaja = descuentoEnCentavos(precio, descuento);
  const nuevo = precio - rebaja;
  return rebaja > 0 && nuevo > 0 ? nuevo : null;
}

/** El día de hoy en El Salvador (UTC-6, sin horario de verano) como "AAAA-MM-DD". */
export function hoyEnElSalvador(ahora: Date): string {
  return new Date(ahora.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Dónde está una oferta según sus días (todos "AAAA-MM-DD", que se comparan como texto): vale desde `desde` hasta el final de `hasta`. */
export function estadoDeOferta(desde: string, hasta: string, hoy: string): EstadoOferta {
  if (hoy < desde) return "programada";
  return hoy > hasta ? "terminada" : "activa";
}
