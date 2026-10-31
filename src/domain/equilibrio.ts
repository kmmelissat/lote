import type { Centavos } from "./dinero";
import type { LineaVendida } from "./resumen";

export type VentaDelDia = { fecha: string; vendido: Centavos };

export type PuntoDeEquilibrio = {
  /** Cuánto de cada dólar vendido queda después del costo de los productos (0 a 1). */
  margen: number;
  /** Lo que había que vender para pagar los gastos del periodo. */
  necesarias: Centavos;
  vendido: Centavos;
  cubierto: boolean;
  /** Lo que falta vender para cubrirlos; 0 si ya se cubrieron. */
  falta: Centavos;
  /** El día (YYYY-MM-DD) en que las ventas acumuladas pasaron la línea; null si todavía no. */
  diaDeCruce: string | null;
};

/** Lo vendido en cada día, del más viejo al más nuevo. Una línea sin fecha conocida no se cuenta. */
export function ventasPorDia(lineas: readonly LineaVendida[], fechaDelPedido: ReadonlyMap<string, string>): VentaDelDia[] {
  const porDia = new Map<string, Centavos>();
  for (const l of lineas) {
    const fecha = fechaDelPedido.get(l.pedidoId);
    if (!fecha) continue;
    porDia.set(fecha, (porDia.get(fecha) ?? 0) + l.precioFinal * l.cantidad);
  }
  return [...porDia].map(([fecha, vendido]) => ({ fecha, vendido })).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Cuánto había que vender para pagar lo que se gastó: gastos / margen, con margen = (vendido − costo de lo vendido) / vendido.
 * Devuelve null si no hay con qué calcularlo: sin ventas, sin gastos o sin margen (costos sin cargar o ventas a pérdida).
 */
export function puntoDeEquilibrio({
  dias,
  costoProductos,
  gastos,
}: {
  dias: readonly VentaDelDia[];
  costoProductos: Centavos;
  gastos: Centavos;
}): PuntoDeEquilibrio | null {
  const vendido = dias.reduce((suma, d) => suma + d.vendido, 0);
  if (vendido <= 0 || gastos <= 0) return null;
  const margen = (vendido - costoProductos) / vendido;
  if (margen <= 0) return null;

  const necesarias = Math.ceil(gastos / margen);
  let acumulado = 0;
  let diaDeCruce: string | null = null;
  for (const d of [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    acumulado += d.vendido;
    if (acumulado >= necesarias) {
      diaDeCruce = d.fecha;
      break;
    }
  }
  const cubierto = vendido >= necesarias;
  return { margen, necesarias, vendido, cubierto, falta: cubierto ? 0 : necesarias - vendido, diaDeCruce };
}
