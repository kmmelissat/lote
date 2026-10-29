import { describe, expect, it } from "vitest";
import { combinarOpciones, agruparProductos } from "./variantes";

describe("agruparProductos", () => {
  const base = {
    descripcion: null, categoria: null, marca: null, condicion: "nuevo", fotos: [], precio: 1000,
    cantidad: 1, apartadas: 0, vendidas: 0, disponibles: 1, estado: "disponible" as const,
    desglose: undefined, costoUnitario: undefined,
  };
  const prod = (codigo: number, nombre: string, grupo: string | null, variante: string | null) => ({
    ...base, id: `id-${codigo}`, codigo, nombre, grupo, variante,
  });

  it("junta las variantes de un grupo y deja sueltos los demás, en el orden de llegada", () => {
    const grupos = agruparProductos([
      prod(3, "Gorra", null, null),
      prod(2, "CD · Gold", "g1", "Gold"),
      prod(1, "CD · Rose", "g1", "Rose"),
    ]);
    expect(grupos.map((g) => g.nombre)).toEqual(["Gorra", "CD"]);
    expect(grupos[1].miembros.map((m) => m.codigo)).toEqual([1, 2]);
    expect(grupos[1].principal.codigo).toBe(1);
    expect(grupos[1].conVariantes).toBe(true);
    expect(grupos[0].conVariantes).toBe(false);
  });
});

describe("combinarOpciones", () => {
  it("hace el cruce de dos opciones", () => {
    expect(combinarOpciones([["iPhone 16", "iPhone 17"], ["Rosa", "Celeste"]])).toEqual([
      "iPhone 16 · Rosa",
      "iPhone 16 · Celeste",
      "iPhone 17 · Rosa",
      "iPhone 17 · Celeste",
    ]);
  });

  it("con una sola opción con valores, devuelve esos valores", () => {
    expect(combinarOpciones([[], ["Rosa", "Rojo"]])).toEqual(["Rosa", "Rojo"]);
  });

  it("junta los repetidos sin importar mayúsculas y recorta espacios", () => {
    expect(combinarOpciones([[" Rosa", "rosa", "Rojo "]])).toEqual(["Rosa", "Rojo"]);
  });

  it("sin valores no hay combinaciones", () => {
    expect(combinarOpciones([[], []])).toEqual([]);
  });
});
