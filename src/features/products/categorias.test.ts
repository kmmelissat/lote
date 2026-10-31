import { describe, expect, it } from "vitest";
import { categoriaDeLista, categoriasQueNoExisten } from "./categorias";

const lista = ["Blusas", "Postres y tartas", "Música"];

describe("categoriaDeLista", () => {
  it("devuelve el nombre exacto de la lista sin importar mayúsculas ni espacios", () => {
    expect(categoriaDeLista(lista, "blusas")).toBe("Blusas");
    expect(categoriaDeLista(lista, "  postres   y TARTAS ")).toBe("Postres y tartas");
  });
  it("es null si no está, o si no hay nada escrito", () => {
    expect(categoriaDeLista(lista, "Zapatos")).toBeNull();
    expect(categoriaDeLista(lista, "   ")).toBeNull();
    expect(categoriaDeLista(lista, undefined)).toBeNull();
  });
});

describe("categoriasQueNoExisten", () => {
  it("junta las que faltan, sin repetir y sin contar las que sí están", () => {
    expect(categoriasQueNoExisten(lista, ["blusas", "Zapatos", "zapatos", undefined, " Bolsos ", "Música"])).toEqual(["Zapatos", "Bolsos"]);
  });
});
