import type { Centavos } from "./dinero";
import { gananciaDespuesDeGastos, gananciaProductos } from "./ganancia";

export type CategoriaGasto = "empaque" | "publicidad" | "transporte" | "local" | "comisiones" | "otros";

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "empaque",
  "publicidad",
  "transporte",
  "local",
  "comisiones",
  "otros",
];

/** Una línea vendida. El descuento y el envío absorbido son del pedido y se repiten en cada línea. */
export type LineaVendida = {
  pedidoId: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioFinal: Centavos; // por unidad
  costoUnitario: Centavos | null; // el que se congeló al vender
  descuento: Centavos;
  envioAbsorbido: Centavos;
};

export type GastoPeriodo = { categoria: CategoriaGasto; monto: Centavos };

export type GananciaProducto = {
  productoId: string;
  nombre: string;
  unidades: number;
  vendido: Centavos;
  ganancia: Centavos;
  sinCosto: boolean;
};

export type ResumenPeriodo = {
  pedidos: number;
  vendido: Centavos;
  costoProductos: Centavos;
  descuentos: Centavos;
  envioAbsorbido: Centavos;
  gastos: Centavos;
  gastosPorCategoria: Partial<Record<CategoriaGasto, Centavos>>;
  gananciaProductos: Centavos;
  gananciaDespuesDeGastos: Centavos;
  /** true si alguna venta no tiene costo: las dos ganancias son un estimado. */
  estimada: boolean;
  /** Productos con ganancia, de mayor a menor. */
  ranking: GananciaProducto[];
};

/**
 * Junta las ventas y los gastos de un periodo en los números de la pantalla Ganancia.
 * Las comisiones se registran como gasto de categoría "comisiones", así que no se restan dos veces.
 */
export function resumenDelPeriodo(lineas: LineaVendida[], gastos: GastoPeriodo[]): ResumenPeriodo {
  const porPedido = new Map<string, { descuento: Centavos; envioAbsorbido: Centavos }>();
  const porProducto = new Map<string, GananciaProducto>();
  let vendido = 0;
  let costoProductos = 0;

  for (const l of lineas) {
    porPedido.set(l.pedidoId, { descuento: l.descuento, envioAbsorbido: l.envioAbsorbido });
    vendido += l.precioFinal * l.cantidad;
    costoProductos += (l.costoUnitario ?? 0) * l.cantidad;

    const p = porProducto.get(l.productoId) ?? {
      productoId: l.productoId,
      nombre: l.nombre,
      unidades: 0,
      vendido: 0,
      ganancia: 0,
      sinCosto: false,
    };
    p.unidades += l.cantidad;
    p.vendido += l.precioFinal * l.cantidad;
    p.ganancia += (l.precioFinal - (l.costoUnitario ?? 0)) * l.cantidad;
    if (l.costoUnitario === null) p.sinCosto = true;
    porProducto.set(l.productoId, p);
  }

  let descuentos = 0;
  let envioAbsorbido = 0;
  for (const p of porPedido.values()) {
    descuentos += p.descuento;
    envioAbsorbido += p.envioAbsorbido;
  }

  const gastosPorCategoria: Partial<Record<CategoriaGasto, Centavos>> = {};
  let totalGastos = 0;
  for (const g of gastos) {
    gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + g.monto;
    totalGastos += g.monto;
  }

  const productos = gananciaProductos(
    lineas.map((l) => ({
      cantidad: l.cantidad,
      precioFinal: l.precioFinal,
      costoUnitario: l.costoUnitario,
    })),
    descuentos,
  );

  return {
    pedidos: porPedido.size,
    vendido,
    costoProductos,
    descuentos,
    envioAbsorbido,
    gastos: totalGastos,
    gastosPorCategoria,
    gananciaProductos: productos.monto,
    gananciaDespuesDeGastos: gananciaDespuesDeGastos(productos.monto, {
      envioAbsorbido,
      gastos: totalGastos,
    }),
    estimada: productos.estimada,
    ranking: [...porProducto.values()].sort((a, b) => b.ganancia - a.ganancia || a.nombre.localeCompare(b.nombre)),
  };
}
