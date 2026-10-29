import { describe, expect, it } from "vitest";
import { COLORES_MARCA, COLOR_POR_DEFECTO, colorDeMarca, estiloDeMarca } from "./marca";

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("colores de marca", () => {
  it("todos dan al menos 4.5 a 1 con texto blanco", () => {
    for (const { hex, nombre } of COLORES_MARCA) {
      expect(1.05 / (luminancia(hex) + 0.05), nombre).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("un color fuera de la paleta o ausente cae en el de Lote", () => {
    expect(colorDeMarca("#ff00ff")).toBe(COLOR_POR_DEFECTO);
    expect(colorDeMarca(null)).toBe(COLOR_POR_DEFECTO);
  });

  it("los botones principales usan el color de la tienda si eligió uno, y el mango de Lote si no", () => {
    expect(estiloDeMarca("#db2777")).toMatchObject({ "--color-accion": "#db2777", "--color-accion-texto": "#ffffff" });
    expect(estiloDeMarca(null)).not.toHaveProperty("--color-accion");
    expect(estiloDeMarca("#ff00ff")).not.toHaveProperty("--color-accion");
  });

  it("reconoce uno de la paleta", () => {
    expect(colorDeMarca("#db2777").id).toBe("rosa");
  });
});
