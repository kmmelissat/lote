import { describe, expect, it } from "vitest";
import { partirEnLineas } from "./sticker";

// Cada letra mide 10: un texto de n letras mide 10 × n.
const medir = (s: string) => s.length * 10;

describe("partirEnLineas", () => {
  it("un nombre corto queda en una línea", () => {
    expect(partirEnLineas(medir, "Chaqueta negra", 200, 2)).toEqual(["Chaqueta negra"]);
  });

  it("parte en dos líneas por palabras", () => {
    expect(partirEnLineas(medir, "Chaqueta negra talla M", 150, 2)).toEqual(["Chaqueta negra", "talla M"]);
  });

  it("si sobra texto, la última línea termina en puntos suspensivos y cabe", () => {
    const l = partirEnLineas(medir, "Chaqueta de mezclilla negra con parches bordados a mano", 150, 2);
    expect(l).toHaveLength(2);
    expect(l[1].endsWith("…")).toBe(true);
    expect(medir(l[1])).toBeLessThanOrEqual(150);
  });

  it("una sola palabra más larga que el ancho se recorta", () => {
    const l = partirEnLineas(medir, "Supercalifragilisticoespialidoso", 100, 2);
    expect(l).toHaveLength(1);
    expect(l[0].endsWith("…")).toBe(true);
    expect(medir(l[0])).toBeLessThanOrEqual(100);
  });

  it("sin texto no devuelve líneas", () => {
    expect(partirEnLineas(medir, "   ", 100, 2)).toEqual([]);
  });
});
