import { describe, expect, it } from "vitest";
import { slugConSufijo, slugDe } from "./slug";

const VALIDO = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;

describe("slugDe", () => {
  it("quita tildes, mayúsculas y símbolos", () => {
    expect(slugDe("Ternuritos Sv")).toBe("ternuritos-sv");
    expect(slugDe("  Koa & Compañía!! ")).toBe("koa-compania");
  });

  it("completa nombres demasiado cortos", () => {
    expect(slugDe("Ab")).toBe("ab-lote");
    expect(slugDe("!!!")).toBe("lote");
  });

  it("siempre cumple el formato de la base", () => {
    for (const nombre of ["Capo", "x".repeat(80), "Mims - Tienda 24/7", "ñandú"]) {
      expect(slugDe(nombre)).toMatch(VALIDO);
    }
  });

  it("con sufijo sigue siendo válido", () => {
    expect(slugConSufijo(slugDe("x".repeat(80)), "a1b2")).toMatch(VALIDO);
  });
});
