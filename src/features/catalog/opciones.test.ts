import { describe, expect, it } from "vitest";
import { filasDeOpciones } from "./opciones";

const o = (codigo: number, variante: string, disponibles = 1) => ({ codigo, variante, disponibles });

describe("filasDeOpciones", () => {
  const cruce = [
    o(1, "iPhone 16 · Rosa"),
    o(2, "iPhone 16 · Celeste"),
    o(3, "iPhone 17 · Rosa"),
    o(4, "iPhone 17 · Celeste", 0),
  ];

  it("separa el cruce en una fila por opción y deduce el color", () => {
    const filas = filasDeOpciones(cruce, 1)!;
    expect(filas.map((f) => f.titulo)).toEqual(["Opción 1", "Color"]);
    expect(filas[0].fichas.map((f) => f.valor)).toEqual(["iPhone 16", "iPhone 17"]);
    expect(filas[1].fichas.map((f) => f.valor)).toEqual(["Rosa", "Celeste"]);
  });

  it("cada ficha lleva a la variante que mantiene lo elegido en las otras opciones", () => {
    const filas = filasDeOpciones(cruce, 1)!; // elegida: iPhone 16 · Rosa
    expect(filas[0].fichas.find((f) => f.valor === "iPhone 17")!.codigo).toBe(3); // iPhone 17 · Rosa
    expect(filas[1].fichas.find((f) => f.valor === "Celeste")!.codigo).toBe(2); // iPhone 16 · Celeste
    expect(filas[0].fichas.find((f) => f.valor === "iPhone 16")!.actual).toBe(true);
  });

  it("marca como no disponible lo que no hay con lo ya elegido", () => {
    const filas = filasDeOpciones(cruce, 3)!; // iPhone 17 · Rosa
    expect(filas[1].fichas.find((f) => f.valor === "Celeste")!.disponible).toBe(false); // iPhone 17 · Celeste agotado
    expect(filas[1].fichas.find((f) => f.valor === "Rosa")!.disponible).toBe(true);
  });

  it("usa los nombres que puso la dueña", () => {
    const filas = filasDeOpciones(cruce, 1, ["Modelo", "Color"])!;
    expect(filas.map((f) => f.titulo)).toEqual(["Modelo", "Color"]);
  });

  it("si los nombres no coinciden con las partes, deduce", () => {
    expect(filasDeOpciones(cruce, 1, ["Modelo"])!.map((f) => f.titulo)).toEqual(["Opción 1", "Color"]);
  });

  it("si no es un cruce devuelve null", () => {
    expect(filasDeOpciones([o(1, "M"), o(2, "L")], 1)).toBeNull();
    expect(filasDeOpciones([o(1, "A · B"), o(2, "C")], 1)).toBeNull();
  });
});
