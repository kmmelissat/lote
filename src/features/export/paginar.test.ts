import { describe, expect, it } from "vitest";
import { todas } from "./paginar";

const fuente = (n: number) => async (desde: number, cantidad: number) =>
  Array.from({ length: n }, (_, i) => i).slice(desde, desde + cantidad);

describe("todas", () => {
  it("junta varias páginas", async () => {
    expect(await todas(fuente(1203), 500)).toHaveLength(1203);
  });

  it("si el total es múltiplo de la página, pide una más y termina", async () => {
    expect(await todas(fuente(1000), 500)).toHaveLength(1000);
  });

  it("sin filas devuelve una lista vacía", async () => {
    expect(await todas(fuente(0), 500)).toEqual([]);
  });
});
