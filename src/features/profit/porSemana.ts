import { type Centavos, type LineaVendida, type Periodo, type ResumenPeriodo, resumenDelPeriodo } from "@/domain";

export type SemanaResumen = {
  /** Lunes de esa semana (YYYY-MM-DD) */
  desde: string;
  vendido: Centavos;
  gananciaDespuesDeGastos: Centavos;
  estimada: boolean;
  /** Todos los números de la semana, los mismos de Ganancia */
  resumen: ResumenPeriodo;
};

type GastoConFecha = { categoria: Parameters<typeof resumenDelPeriodo>[1][number]["categoria"]; monto: Centavos; fecha: string };

/**
 * Reparte las ventas y los gastos de un rango largo entre sus semanas.
 * `creado` dice cuándo se creó cada pedido (las ventas no traen fecha); una venta cuyo pedido no aparece se descarta.
 */
export function repartirPorSemana(
  periodos: Periodo[],
  ventas: LineaVendida[],
  creado: Map<string, number>,
  gastos: GastoConFecha[],
): SemanaResumen[] {
  return periodos.map((p) => {
    const lineas = ventas.filter((v) => {
      const t = creado.get(v.pedidoId);
      return t !== undefined && t >= p.desde.getTime() && t < p.hasta.getTime();
    });
    const delPeriodo = gastos.filter((g) => g.fecha >= p.desdeFecha && g.fecha < p.hastaFecha);
    const resumen = resumenDelPeriodo(lineas, delPeriodo);
    return {
      desde: p.desdeFecha,
      vendido: resumen.vendido,
      gananciaDespuesDeGastos: resumen.gananciaDespuesDeGastos,
      estimada: resumen.estimada,
      resumen,
    };
  });
}
