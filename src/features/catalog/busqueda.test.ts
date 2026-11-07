import { describe, expect, it } from "vitest";
import { categoriasQueCoinciden, singular } from "./busqueda";

describe("busqueda del Marketplace", () => {
  it("quita tildes, mayúsculas y plurales simples", () => {
    expect(singular("Cordón")).toBe(singular("cordon"));
    expect(singular("Pasteles")).toBe("pastel");
    expect(singular("Brochas")).toBe("brocha");
  });
  it("encuentra categorías sin importar tildes ni plural", () => {
    expect(categoriasQueCoinciden("calzados").map((c) => c.nombre)).toContain("Calzado");
    expect(categoriasQueCoinciden("sueteres").map((c) => c.nombre)).toContain("Chaquetas y suéteres");
  });
  it("no sugiere nada con un texto sin sentido ni con una letra", () => {
    expect(categoriasQueCoinciden("zzzqqq")).toEqual([]);
    expect(categoriasQueCoinciden("a")).toEqual([]);
  });
});
