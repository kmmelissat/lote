import { describe, expect, it } from "vitest";
import { categoriasQueCoinciden, singular, trozosResaltados } from "./busqueda";

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

describe("trozosResaltados", () => {
  const marcados = (texto: string, q: string) => trozosResaltados(texto, q).filter((t) => t.marcado).map((t) => t.texto);

  it("marca lo buscado sin importar tildes ni mayúsculas, y conserva el texto original", () => {
    const trozos = trozosResaltados("Cordón de Seda", "cordon");
    expect(trozos).toEqual([
      { texto: "Cordón", marcado: true },
      { texto: " de Seda", marcado: false },
    ]);
  });

  it("un plural encuentra el singular", () => {
    expect(marcados("Pastel de fresa", "pasteles")).toEqual(["Pastel"]);
  });

  it("marca cada palabra buscada, en cualquier orden (de un plural, la raíz)", () => {
    expect(marcados("Collar de perlas", "perlas collar")).toEqual(["Collar", "perla"]);
  });

  it("sin coincidencia o sin búsqueda, un solo trozo sin marcar", () => {
    expect(trozosResaltados("Collar", "zapato")).toEqual([{ texto: "Collar", marcado: false }]);
    expect(trozosResaltados("Collar", "  ")).toEqual([{ texto: "Collar", marcado: false }]);
  });

  it("los trozos juntos dan el texto de siempre", () => {
    const texto = "Árbol de Navidad";
    expect(trozosResaltados(texto, "arbol navidad").map((t) => t.texto).join("")).toBe(texto);
  });
});
