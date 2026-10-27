import { describe, expect, it } from "vitest";
import { costoPromedio, costoUnitario, desgloseDeFilas } from "./costos";

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
