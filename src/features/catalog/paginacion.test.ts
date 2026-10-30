import { describe, expect, it } from "vitest";
import { paginasVisibles, rango } from "./paginacion";

describe("paginasVisibles", () => {
  it("con pocas páginas van todas", () => {
    expect(paginasVisibles(1, 1)).toEqual([1]);
    expect(paginasVisibles(2, 4)).toEqual([1, 2, 3, 4]);
    expect(paginasVisibles(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("salta lo del medio, con la actual y sus vecinas", () => {
    expect(paginasVisibles(6, 12)).toEqual([1, "salto", 5, 6, 7, "salto", 12]);
    expect(paginasVisibles(1, 12)).toEqual([1, 2, "salto", 12]);
    expect(paginasVisibles(12, 12)).toEqual([1, "salto", 11, 12]);
  });

  it("no pone '…' para tapar una sola página", () => {
    expect(paginasVisibles(4, 12)).toEqual([1, 2, 3, 4, 5, "salto", 12]);
    expect(paginasVisibles(9, 12)).toEqual([1, "salto", 8, 9, 10, 11, 12]);
  });
});

describe("rango", () => {
  it("dice qué productos se ven, sin pasarse del total", () => {
    expect(rango(1, 24, 70)).toEqual({ desde: 1, hasta: 24 });
    expect(rango(3, 24, 70)).toEqual({ desde: 49, hasta: 70 });
  });
});
