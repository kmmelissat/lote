import { describe, expect, it } from "vitest";
import { normalizarTexto } from "./texto";

describe("normalizarTexto", () => {
  it("quita tildes y pasa a minúsculas", () => {
    expect(normalizarTexto("Árbol de Navidad")).toBe("arbol de navidad");
  });

  it("pasa la ñ a n", () => {
    expect(normalizarTexto("Niño")).toBe("nino");
  });

  it("no toca espacios ni símbolos", () => {
    expect(normalizarTexto(" Té-2 ")).toBe(" te-2 ");
  });
});
