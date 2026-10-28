import { describe, expect, it } from "vitest";
import { resumenDelPeriodo, type LineaVendida } from "@/domain";
import { frasesDeLotito } from "./lotito";

const linea = (nombre: string, precio: number, costo: number | null): LineaVendida => ({
  pedidoId: nombre,
  productoId: nombre,
  nombre,
  cantidad: 1,
  precioFinal: precio,
  costoUnitario: costo,
  descuento: 0,
  envioAbsorbido: 0,
});
const e = { periodo: "esta semana", anterior: "la semana pasada" };

describe("frasesDeLotito", () => {
  it("sin ventas no dice nada", () => {
    expect(frasesDeLotito(resumenDelPeriodo([], []), null, e)).toEqual([]);
  });

  it("cuenta la ganancia, la compara y nombra lo que más dejó", () => {
    const actual = resumenDelPeriodo([linea("Chaqueta", 2500, 1000), linea("Llavero", 300, 100)], []);
    const antes = resumenDelPeriodo([linea("Chaqueta", 2000, 1000)], []);
    const f = frasesDeLotito(actual, antes, e);
    expect(f[0]).toBe("Esta semana ganaste $17.00, 70 % más que la semana pasada.");
    expect(f[1]).toContain("Chaqueta fue lo que más te dejó: $15.00");
  });

  it("avisa de lo que da pérdida y de lo que no tiene costo", () => {
    const actual = resumenDelPeriodo([linea("Gorra", 500, 800), linea("Taza", 400, null)], []);
    const f = frasesDeLotito(actual, null, e);
    expect(f.some((x) => x.includes("Gorra") && x.includes("pérdida"))).toBe(true);
    expect(f.some((x) => x.includes("Faltan costos"))).toBe(true);
  });
});
