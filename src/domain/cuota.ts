import type { Centavos } from "./dinero";

/** Cuántas cuotas faltan para saldar la deuda con lo que se paga cada vez (la última puede ser menor). 0 si no queda nada. */
export function cuotasRestantes(saldo: Centavos, cuota: Centavos): number {
  if (saldo <= 0 || cuota <= 0) return 0;
  return Math.ceil(saldo / cuota);
}

const aFecha = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const diasDelMes = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * La próxima fecha (AAAA-MM-DD) en que toca pagar, dado el día del mes. Si hoy es ese día, es hoy. En los meses más cortos
 * cae el último día: un 31 en febrero es el 28.
 */
export function proximoPago(diaPago: number, hoy: Date): string {
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  const esteMes = Math.min(diaPago, diasDelMes(y, m));
  if (hoy.getDate() <= esteMes) return aFecha(y, m, esteMes);
  const sigue = new Date(y, m + 1, 1);
  return aFecha(sigue.getFullYear(), sigue.getMonth(), Math.min(diaPago, diasDelMes(sigue.getFullYear(), sigue.getMonth())));
}
