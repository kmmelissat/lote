import { describe, expect, it } from "vitest";
import { interpretarBusqueda } from "./busqueda";

describe("interpretarBusqueda", () => {
  it("un número, con o sin #, es el número de pedido", () => {
    expect(interpretarBusqueda("41")).toEqual({ codigo: 41 });
    expect(interpretarBusqueda(" #41 ")).toEqual({ codigo: 41 });
  });
  it("lo demás es el nombre de la clienta", () => {
    expect(interpretarBusqueda("  Ana   López ")).toEqual({ nombre: "Ana López" });
  });
  it("quita lo que rompería la consulta", () => {
    expect(interpretarBusqueda("100%_(a),b")).toEqual({ nombre: "100 a b" });
  });
  it("vacío no busca", () => {
    expect(interpretarBusqueda("   ")).toBeNull();
    expect(interpretarBusqueda(undefined)).toBeNull();
  });
});
