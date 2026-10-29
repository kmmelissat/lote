import { describe, expect, it } from "vitest";
import { leerResenaDeCliente, leerResenaManual } from "./formularios";

const id = "3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b";
const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

describe("leerResenaDeCliente", () => {
  it("acepta de 1 a 5 estrellas y recorta el texto", () => {
    expect(leerResenaDeCliente(form({ estrellas: "5", texto: "  Muy linda  " }), id, 12)).toEqual({ pedido: id, codigo: 12, estrellas: 5, texto: "Muy linda" });
  });

  it("rechaza estrellas fuera de rango, decimales, vacías o un texto de más de 500", () => {
    for (const estrellas of ["0", "6", "3.5", "", "abc"]) expect(leerResenaDeCliente(form({ estrellas }), id, 1)).toBeNull();
    expect(leerResenaDeCliente(form({ estrellas: "4", texto: "a".repeat(501) }), id, 1)).toBeNull();
  });

  it("rechaza un pedido que no es uuid o un código que no es entero", () => {
    expect(leerResenaDeCliente(form({ estrellas: "4" }), "nope", 1)).toBeNull();
    expect(leerResenaDeCliente(form({ estrellas: "4" }), id, 1.5)).toBeNull();
  });
});

describe("leerResenaManual", () => {
  it("lee una reseña de la tienda, con o sin producto", () => {
    expect(leerResenaManual(form({ nombre: "Ana", estrellas: "5", texto: "Genial", producto: "7" }))).toEqual({ codigo: 7, nombre: "Ana", estrellas: 5, texto: "Genial" });
    expect(leerResenaManual(form({ nombre: "Ana", estrellas: "4" }))?.codigo).toBeNull();
  });

  it("rechaza sin nombre, con nombre largo, estrellas inválidas o un producto que no es entero", () => {
    expect(leerResenaManual(form({ nombre: "", estrellas: "5" }))).toBeNull();
    expect(leerResenaManual(form({ nombre: "a".repeat(61), estrellas: "5" }))).toBeNull();
    expect(leerResenaManual(form({ nombre: "Ana", estrellas: "9" }))).toBeNull();
    expect(leerResenaManual(form({ nombre: "Ana", estrellas: "5", producto: "x" }))).toBeNull();
    expect(leerResenaManual(form({ nombre: "Ana", estrellas: "5", producto: "1.5" }))).toBeNull();
  });
});
