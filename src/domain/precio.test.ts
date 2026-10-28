import { describe, expect, it } from "vitest";
import { precioSugerido } from "./precio";

describe("precioSugerido", () => {
  it("el margen es sobre el precio de venta, redondeado hacia arriba a 0.50", () => {
    // $10.00 de costo con 40% → $16.67 → $17.00
    expect(precioSugerido(1000, 40)).toBe(1700);
  });

  it("un resultado exacto no sube de más", () => {
    expect(precioSugerido(1000, 50)).toBe(2000);
    expect(precioSugerido(600, 40)).toBe(1000);
  });

  it("nunca deja menos margen del pedido", () => {
    for (const costo of [137, 333, 999, 2450, 7777]) {
      for (const margen of [10, 25, 33, 40, 60]) {
        const precio = precioSugerido(costo, margen)!;
        expect((precio - costo) / precio).toBeGreaterThanOrEqual(margen / 100 - 1e-9);
      }
    }
  });

  it("con margen cero redondea el costo hacia arriba", () => {
    expect(precioSugerido(333, 0)).toBe(350);
  });

  it("acepta márgenes con decimales", () => {
    // 10 / 0.625 = 16 exacto
    expect(precioSugerido(1000, 37.5)).toBe(1600);
    expect(precioSugerido(1000, 33.33)).toBe(1500);
  });

  it("sin costo o con un margen imposible no sugiere nada", () => {
    expect(precioSugerido(0, 40)).toBeNull();
    expect(precioSugerido(-100, 40)).toBeNull();
    expect(precioSugerido(1000, -5)).toBeNull();
    expect(precioSugerido(1000, 100)).toBeNull();
    expect(precioSugerido(1000, Number.NaN)).toBeNull();
  });
});
