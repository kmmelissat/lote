import { describe, expect, it } from "vitest";
import { gananciaDespuesDeGastos, gananciaProductos } from "./ganancia";

describe("gananciaProductos", () => {
  it("la chaqueta de $25 que costó $10 deja $15", () => {
    const r = gananciaProductos([{ cantidad: 1, precioFinal: 2500, costoUnitario: 1000 }]);
    expect(r).toEqual({ monto: 1500, estimada: false });
  });

  it("multiplica por la cantidad", () => {
    const r = gananciaProductos([{ cantidad: 2, precioFinal: 300, costoUnitario: 100 }]);
    expect(r.monto).toBe(400);
  });

  it("marca como estimada si falta algún costo", () => {
    const r = gananciaProductos([
      { cantidad: 1, precioFinal: 2500, costoUnitario: 1000 },
      { cantidad: 1, precioFinal: 500, costoUnitario: null },
    ]);
    expect(r).toEqual({ monto: 2000, estimada: true });
  });

  it("resta descuentos y devoluciones", () => {
    const r = gananciaProductos(
      [{ cantidad: 1, precioFinal: 2500, costoUnitario: 1000 }],
      200,
      300,
    );
    expect(r.monto).toBe(1000);
  });

  it("sin ventas la ganancia es 0", () => {
    expect(gananciaProductos([])).toEqual({ monto: 0, estimada: false });
  });
});

describe("gananciaDespuesDeGastos", () => {
  it("resta envío absorbido, comisiones y gastos", () => {
    expect(
      gananciaDespuesDeGastos(1500, { envioAbsorbido: 200, comisiones: 50, gastos: 500 }),
    ).toBe(750);
  });

  it("puede quedar negativa", () => {
    expect(gananciaDespuesDeGastos(100, { gastos: 500 })).toBe(-400);
  });

  it("sin gastos queda igual", () => {
    expect(gananciaDespuesDeGastos(1500, {})).toBe(1500);
  });
});
