import { resumirMovimientos, type Centavos, type Movimiento, type Periodo } from "@/domain";

/**
 * Lo que entró y salió en cada periodo, con la misma cuenta del Balance (`resumirMovimientos`): dinero que de verdad se movió,
 * por la fecha en que se movió. Los periodos pueden traslaparse.
 */
export function flujoPorPeriodos(movimientos: readonly Movimiento[], periodos: readonly Periodo[]): { entradas: Centavos; salidas: Centavos }[] {
  return periodos.map((p) => {
    const { entradas, salidas } = resumirMovimientos(movimientos.filter((m) => m.fecha >= p.desdeFecha && m.fecha < p.hastaFecha));
    return { entradas, salidas };
  });
}
