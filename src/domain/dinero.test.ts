import { describe, expect, it } from "vitest";
import { aCentavos, aDolares, leerDolares, repartir } from "./dinero";

describe("dinero", () => {
  it("lee montos escritos a mano", () => {
    expect(leerDolares("25")).toBe(2500);
    expect(leerDolares(" $3.50 ")).toBe(350);
    expect(leerDolares("2,5")).toBe(250);
  });

  it("rechaza lo que no es un monto", () => {
    for (const malo of ["", "abc", "-1", "1.234", "1,2,3"]) {
      expect(leerDolares(malo)).toBeNull();
    }
  });

  it("convierte dólares a centavos sin error de punto flotante", () => {
    expect(aCentavos(0.1 + 0.2)).toBe(30);
    expect(aDolares(2550)).toBe(25.5);
  });

  describe("repartir", () => {
    it("reparte en partes iguales y siempre suma el total", () => {
      const partes = repartir(1000, 3);
      expect(partes).toEqual([334, 333, 333]);
      expect(partes.reduce((a, b) => a + b, 0)).toBe(1000);
    });

    it("el lote de $60 entre 10 fotos da $6 a cada una", () => {
      expect(repartir(6000, 10)).toEqual(Array(10).fill(600));
    });

    it("reparte en proporción a los pesos", () => {
      const partes = repartir(1000, 2, [3, 1]);
      expect(partes).toEqual([750, 250]);
    });

    it("no pierde centavos con pesos que no dividen exacto", () => {
      const partes = repartir(100, 3, [1, 1, 1]);
      expect(partes.reduce((a, b) => a + b, 0)).toBe(100);
    });

    it("con peso total 0 reparte en partes iguales", () => {
      expect(repartir(100, 2, [0, 0])).toEqual([50, 50]);
    });

    it("con n = 0 devuelve vacío", () => {
      expect(repartir(100, 0)).toEqual([]);
    });
  });
});
