import { describe, expect, it, vi } from "vitest";

// leerFormulario.ts trae la sesión y la base: aquí solo se prueba lo puro.
vi.mock("@/lib/negocio", () => ({ negocioActual: vi.fn() }));
vi.mock("./repositorio", () => ({ listarCategorias: vi.fn() }));

import { fotosValidas, leerCostos, leerNombreYPrecio, valoresDe } from "./leerFormulario";

describe("valoresDe", () => {
  it("deja solo los campos de texto y quita los que empiezan con $", () => {
    const f = new FormData();
    f.set("nombre", "Funda");
    f.set("$ACTION_ID_1", "x");
    f.set("foto", new Blob(["a"]), "a.png");
    expect(valoresDe(f)).toEqual({ nombre: "Funda" });
  });
});

describe("leerNombreYPrecio", () => {
  it("lee el nombre recortado y el precio en centavos", () => {
    expect(leerNombreYPrecio({ nombre: "  Funda  ", precio: "12.50" })).toMatchObject({ nombre: "Funda", precio: 1250, errores: {} });
  });

  it("avisa nombre vacío y precio que no se entiende", () => {
    const r = leerNombreYPrecio({ nombre: " ", precio: "abc" });
    expect(r.precio).toBeNull();
    expect(Object.keys(r.errores).sort()).toEqual(["nombre", "precio"]);
  });
});

describe("leerCostos", () => {
  it("salta los vacíos y convierte el resto a centavos", () => {
    expect(leerCostos({ compra: "3", envio: "", importacion: " 1.25 " }).costos).toEqual([
      { tipo: "compra", monto: 300 },
      { tipo: "importacion", monto: 125 },
    ]);
  });

  it("marca el campo que no se entiende", () => {
    const r = leerCostos({ compra: "tres", otro: "2" });
    expect(Object.keys(r.errores)).toEqual(["compra"]);
    expect(r.costos).toEqual([{ tipo: "otro", monto: 200 }]);
  });
});

describe("fotosValidas", () => {
  it("un JSON roto o que no es lista da vacío", () => {
    expect(fotosValidas("no es json", "n1")).toEqual([]);
    expect(fotosValidas('{"a":1}', "n1")).toEqual([]);
    expect(fotosValidas(undefined, "n1")).toEqual([]);
  });
});
