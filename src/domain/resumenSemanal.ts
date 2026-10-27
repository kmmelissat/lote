import type { Centavos } from "./dinero";
import type { GananciaProducto, ResumenPeriodo } from "./resumen";

export type ResumenSemanal = {
  pedidos: number;
  vendido: Centavos;
  /** Cambio contra la semana anterior en %, redondeado. Null si la anterior no vendió nada. */
  variacion: number | null;
  /** El producto que más dejó, o null si no hubo ventas */
  mejor: GananciaProducto | null;
  gananciaDespuesDeGastos: Centavos;
  estimada: boolean;
};

/**
 * Las cifras del resumen semanal. Todo sale de `resumenDelPeriodo`: acá solo se comparan y se eligen,
 * el texto lo arma la pantalla. La IA no interviene, así que no puede inventar un número.
 */
export function resumenSemanal(actual: ResumenPeriodo, anterior: ResumenPeriodo): ResumenSemanal {
  return {
    pedidos: actual.pedidos,
    vendido: actual.vendido,
    variacion: anterior.vendido > 0 ? Math.round(((actual.vendido - anterior.vendido) / anterior.vendido) * 100) : null,
    mejor: actual.ranking[0] ?? null,
    gananciaDespuesDeGastos: actual.gananciaDespuesDeGastos,
    estimada: actual.estimada,
  };
}
