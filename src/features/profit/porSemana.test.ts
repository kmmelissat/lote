import { describe, expect, it } from "vitest";
import { aCentavos, rangoPeriodo, resumenDelPeriodo, type LineaVendida } from "@/domain";
import { repartirPorSemana } from "./porSemana";

const linea = (pedidoId: string, precio: number, costo: number): LineaVendida => ({
  pedidoId,
  productoId: `p-${pedidoId}`,
  nombre: "Chaqueta",
  cantidad: 1,
  precioFinal: aCentavos(precio),
  costoUnitario: aCentavos(costo),
  descuento: 0,
  envioAbsorbido: 0,
});

describe("repartirPorSemana", () => {
  const ahora = new Date("2026-10-28T18:00:00Z"); // miércoles
  const periodos = [-1, 0].map((d) => rangoPeriodo("semana", ahora, d));

  it("cada venta cae en la semana en que se creó su pedido", () => {
    const ventas = [linea("a", 25, 10), linea("b", 40, 15)];
    const creado = new Map([
      ["a", periodos[0].desde.getTime() + 3_600_000],
      ["b", periodos[1].desde.getTime() + 3_600_000],
    ]);
    const [anterior, actual] = repartirPorSemana(periodos, ventas, creado, []);
    expect(anterior.vendido).toBe(aCentavos(25));
    expect(actual.vendido).toBe(aCentavos(40));
  });

  it("da lo mismo que calcular cada semana por separado", () => {
    const ventas = [linea("a", 25, 10), linea("b", 40, 15)];
    const creado = new Map([
      ["a", periodos[0].desde.getTime() + 3_600_000],
      ["b", periodos[1].desde.getTime() + 3_600_000],
    ]);
    const gastos = [{ categoria: "empaque" as const, monto: aCentavos(5), fecha: periodos[1].desdeFecha }];
    const [, actual] = repartirPorSemana(periodos, ventas, creado, gastos);
    expect(actual.resumen).toEqual(resumenDelPeriodo([ventas[1]], gastos));
  });

  it("descarta una venta sin pedido conocido y un gasto fuera de las semanas", () => {
    const [anterior, actual] = repartirPorSemana(
      periodos,
      [linea("x", 99, 1)],
      new Map(),
      [{ categoria: "otros", monto: aCentavos(7), fecha: "2020-01-01" }],
    );
    expect(anterior.vendido + actual.vendido).toBe(0);
    expect(anterior.resumen.gastos + actual.resumen.gastos).toBe(0);
  });
});
