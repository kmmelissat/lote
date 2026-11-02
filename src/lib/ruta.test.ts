import { describe, expect, it } from "vitest";
import { conBusqueda, ruta } from "./ruta";

describe("conBusqueda", () => {
  it("agrega los parámetros, o deja la ruta sola si no hay ninguno", () => {
    expect(conBusqueda("/clientes", new URLSearchParams({ q: "ana maría", saldo: "1" }))).toBe("/clientes?q=ana+mar%C3%ADa&saldo=1");
    expect(conBusqueda("/clientes", new URLSearchParams())).toBe("/clientes");
  });

  it("acepta los parámetros ya escritos, con o sin el signo de pregunta", () => {
    expect(conBusqueda("/pedidos", "estado=pagado")).toBe("/pedidos?estado=pagado");
    expect(conBusqueda("/pedidos", "?estado=pagado")).toBe("/pedidos?estado=pagado");
  });
});

describe("ruta", () => {
  it("devuelve la misma dirección", () => {
    expect(ruta(`/productos/${7}`)).toBe("/productos/7");
  });
});
