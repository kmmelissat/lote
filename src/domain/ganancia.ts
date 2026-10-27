import type { Centavos } from "./dinero";

export type ItemVendido = {
  cantidad: number;
  precioFinal: Centavos; // por unidad
  costoUnitario: Centavos | null; // null = no se registró
};

export type ResultadoGanancia = {
  monto: Centavos;
  /** true si algún producto vendido no tiene costo y la ganancia es solo un estimado */
  estimada: boolean;
};

/** Ganancia de productos: Σ (precio final − costo unitario) × cantidad − descuentos − devoluciones. */
export function gananciaProductos(
  items: ItemVendido[],
  descuentos: Centavos = 0,
  devoluciones: Centavos = 0,
): ResultadoGanancia {
  let monto = 0;
  let estimada = false;
  for (const i of items) {
    if (i.costoUnitario === null) estimada = true;
    monto += (i.precioFinal - (i.costoUnitario ?? 0)) * i.cantidad;
  }
  return { monto: monto - descuentos - devoluciones, estimada };
}

export type GastosPeriodo = {
  envioAbsorbido?: Centavos;
  comisiones?: Centavos;
  gastos?: Centavos;
};

/** Ganancia después de gastos: ganancia de productos − envío absorbido − comisiones − gastos. */
export function gananciaDespuesDeGastos(
  gananciaDeProductos: Centavos,
  g: GastosPeriodo,
): Centavos {
  return (
    gananciaDeProductos -
    (g.envioAbsorbido ?? 0) -
    (g.comisiones ?? 0) -
    (g.gastos ?? 0)
  );
}
