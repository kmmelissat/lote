import { describe, expect, it } from "vitest";
import { resumenDelPeriodo, type LineaVendida } from "./resumen";
import { resumenSemanal } from "./resumenSemanal";

const linea = (pedidoId: string, nombre: string, precio: number, costo: number | null): LineaVendida => ({
  pedidoId,
  productoId: nombre,
  nombre,
  cantidad: 1,
  precioFinal: precio,
  costoUnitario: costo,
  descuento: 0,
  envioAbsorbido: 0,
});

const semana = (lineas: LineaVendida[], gastos = 0) =>
  resumenDelPeriodo(lineas, gastos ? [{ categoria: "empaque", monto: gastos }] : []);

describe("resumenSemanal", () => {
  it("compara lo vendido con la semana anterior", () => {
    const r = resumenSemanal(semana([linea("a", "Chaqueta", 3000, 1000)]), semana([linea("b", "Chaqueta", 2000, 1000)]));
    expect(r.vendido).toBe(3000);
    expect(r.variacion).toBe(50);
  });

  it("sin ventas la semana anterior no hay porcentaje", () => {
    const r = resumenSemanal(semana([linea("a", "Chaqueta", 3000, 1000)]), semana([]));
    expect(r.variacion).toBeNull();
  });

  it("elige el producto que más dejó y resta los gastos de la ganancia", () => {
    const r = resumenSemanal(
      semana([linea("a", "Llavero", 500, 100), linea("b", "Chaqueta", 3000, 1000)], 300),
      semana([]),
    );
    expect(r.mejor?.nombre).toBe("Chaqueta");
    expect(r.gananciaDespuesDeGastos).toBe(2100);
  });

  it("sin ventas no hay mejor producto", () => {
    const r = resumenSemanal(semana([]), semana([]));
    expect(r).toMatchObject({ pedidos: 0, vendido: 0, mejor: null, estimada: false });
  });
});
