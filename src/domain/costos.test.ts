import { describe, expect, it } from "vitest";
import { costoPromedio, costoUnitario, desgloseDeFilas, repartirCostoTotal } from "./costos";

describe("desgloseDeFilas", () => {
  it("sin filas no hay desglose", () => {
    expect(desgloseDeFilas([], 5)).toBeUndefined();
  });

  it("suma los rubros del mismo tipo", () => {
    const d = desgloseDeFilas(
      [
        { tipo: "compra", monto: 100, porUnidad: true },
        { tipo: "compra", monto: 50, porUnidad: true },
      ],
      3,
    );
    expect(d).toEqual({ compra: 150 });
  });

  it("un costo total se divide entre la cantidad", () => {
    const d = desgloseDeFilas([{ tipo: "envio", monto: 500, porUnidad: false }], 5);
    expect(costoUnitario(d)).toBe(100);
  });
});

describe("costoPromedio al reponer", () => {
  it("pondera por unidades: 4 a $1 y 6 a $2 dan $1.60", () => {
    expect(costoPromedio(4, 100, 6, 200)).toBe(160);
  });

  it("sin existencia previa queda el costo nuevo", () => {
    expect(costoPromedio(0, 100, 10, 250)).toBe(250);
  });

  it("sin unidades devuelve 0", () => {
    expect(costoPromedio(0, 100, 0, 200)).toBe(0);
  });

  it("redondea al centavo", () => {
    expect(costoPromedio(1, 100, 2, 100)).toBe(100);
    expect(costoPromedio(1, 100, 1, 101)).toBe(101);
  });
});

describe("costoUnitario", () => {
  it("suma compra, envío, importación y otros", () => {
    expect(costoUnitario({ compra: 1000, envio: 150, importacion: 200, otro: 50 })).toBe(1400);
  });

  it("devuelve null si no hay ningún costo registrado", () => {
    expect(costoUnitario(undefined)).toBeNull();
    expect(costoUnitario({})).toBeNull();
  });

  it("un costo de 0 explícito cuenta como registrado", () => {
    expect(costoUnitario({ compra: 0 })).toBe(0);
  });
});

describe("repartirCostoTotal", () => {
  it("reparte en partes iguales cuando divide exacto", () => {
    expect(repartirCostoTotal(6000, 10)).toEqual(Array(10).fill(600));
  });

  it("los centavos que sobran van a las primeras piezas y la suma da el total", () => {
    const partes = repartirCostoTotal(1000, 3);
    expect(partes).toEqual([334, 333, 333]);
    expect(partes.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it("siempre suma el total", () => {
    for (const [total, n] of [[1, 3], [9999, 7], [0, 4], [12345, 10]] as const) {
      expect(repartirCostoTotal(total, n).reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("una sola pieza se queda con todo", () => {
    expect(repartirCostoTotal(2500, 1)).toEqual([2500]);
  });

  it("datos imposibles no reparten nada", () => {
    expect(repartirCostoTotal(1000, 0)).toEqual([]);
    expect(repartirCostoTotal(-5, 3)).toEqual([]);
    expect(repartirCostoTotal(1000, 2.5)).toEqual([]);
  });
});
