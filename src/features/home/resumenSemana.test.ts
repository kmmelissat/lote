import { describe, expect, it } from "vitest";
import { compararCifra, rangoCorto } from "./resumenSemana";

describe("compararCifra", () => {
  it("dice el porcentaje cuando sube o baja", () => {
    expect(compararCifra(11800, 10000)).toMatchObject({ corto: "+18 %", sube: true });
    expect(compararCifra(5000, 10000)).toMatchObject({ corto: "−50 %", sube: false });
  });
  it("no compara sin semana anterior y dice igual si no cambió", () => {
    expect(compararCifra(100, null)).toBeNull();
    expect(compararCifra(100, 100)).toMatchObject({ corto: "Igual", sube: null });
  });
  it("con base cero o ganancia negativa muestra la cifra, no un porcentaje", () => {
    expect(compararCifra(-5200, 14000)?.texto).toContain("contra");
    expect(compararCifra(5000, 0)?.texto).toContain("contra");
  });
});

describe("rangoCorto", () => {
  it("junta el mes cuando es el mismo", () => {
    expect(rangoCorto("2026-11-02", "2026-11-09")).toBe("2 – 8 nov");
    expect(rangoCorto("2026-10-27", "2026-11-03")).toBe("27 oct – 2 nov");
    expect(rangoCorto("2026-11-02", "2026-11-03")).toBe("2 nov");
  });
});
