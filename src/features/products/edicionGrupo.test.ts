import { describe, expect, it } from "vitest";
import { leerFilas, validarFilas, type FilaEdicion } from "./edicionGrupo";

const fila = (cambios: Partial<FilaEdicion> = {}): FilaEdicion => ({ id: "a", etiqueta: "M", precio: "12", cantidad: "3", compra: "", fotos: [], ...cambios });

describe("leerFilas", () => {
  it("lee el JSON y descarta lo que no tiene forma de fila", () => {
    expect(leerFilas('[{"id":"a","etiqueta":"M","precio":12,"cantidad":"3","compra":"","fotos":["x"]}, 5]')).toEqual([
      { id: "a", etiqueta: "M", precio: "12", cantidad: "3", compra: "", fotos: ["x"] },
    ]);
    expect(leerFilas("no es json")).toEqual([]);
  });
});

describe("validarFilas", () => {
  it("convierte precios y costos a centavos", () => {
    const r = validarFilas([fila({ compra: "4.5" }), fila({ id: null, etiqueta: "L", precio: "13.50", cantidad: "2" })], new Map());
    expect(r).toEqual({
      ok: true,
      filas: [
        { id: "a", etiqueta: "M", precio: 1200, cantidad: 3, compra: 450, fotos: [] },
        { id: null, etiqueta: "L", precio: 1350, cantidad: 2, compra: null, fotos: [] },
      ],
    });
  });

  it("no deja nombres repetidos ni vacíos, ni filas sin precio", () => {
    expect(validarFilas([fila(), fila({ id: "b", etiqueta: " m " })], new Map())).toMatchObject({ ok: false, error: { tipo: "repetida" } });
    expect(validarFilas([fila({ etiqueta: " " })], new Map())).toMatchObject({ ok: false, error: { tipo: "etiqueta" } });
    expect(validarFilas([fila({ precio: "" })], new Map())).toMatchObject({ ok: false, error: { tipo: "precio" } });
  });

  it("una variante que ya existe puede quedar en 0, pero nunca por debajo de lo apartado o vendido; una nueva arranca en 1", () => {
    expect(validarFilas([fila({ cantidad: "0" })], new Map())).toMatchObject({ ok: true });
    expect(validarFilas([fila({ cantidad: "1" })], new Map([["a", 2]]))).toEqual({ ok: false, error: { tipo: "comprometidas", etiqueta: "M", minimo: 2 } });
    expect(validarFilas([fila({ id: null, cantidad: "0" })], new Map())).toMatchObject({ ok: false, error: { tipo: "cantidad" } });
  });

  it("un costo que no se entiende es error; vacío está bien", () => {
    expect(validarFilas([fila({ compra: "abc" })], new Map())).toMatchObject({ ok: false, error: { tipo: "costo" } });
  });
});
