import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { proponerMapeo, validarFila } from "./mapeo";

describe("parseCsv", () => {
  it("lee comas, punto y coma y tabulador", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("respeta comillas con comas, saltos y comillas dobles", () => {
    expect(parseCsv('nombre,nota\n"Llavero, rosa","dice ""hola""\ny adiós"')).toEqual([
      ["nombre", "nota"],
      ["Llavero, rosa", 'dice "hola"\ny adiós'],
    ]);
  });

  it("ignora el BOM de Excel, los saltos de Windows y las filas vacías", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n\r\n,\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("proponerMapeo", () => {
  it("reconoce encabezados comunes, con tildes y mayúsculas", () => {
    const m = proponerMapeo(["Producto", "Precio de venta", "Stock", "Costo unitario", "Categoría", "Marca"]);
    expect(m).toEqual({ nombre: 0, precio: 1, cantidad: 2, costo: 3, categoria: 4, marca: 5 });
  });

  it("no usa la misma columna para dos campos", () => {
    const m = proponerMapeo(["Precio", "Nombre"]);
    expect(m.nombre).toBe(1);
    expect(m.precio).toBe(0);
    expect(m.costo).toBeUndefined();
  });

  it("deja sin mapear lo que no reconoce", () => {
    expect(proponerMapeo(["x", "y"])).toEqual({});
  });
});

describe("validarFila", () => {
  const mapeo = { nombre: 0, precio: 1, cantidad: 2, costo: 3 };

  it("convierte a centavos y usa cantidad 1 si viene vacía", () => {
    expect(validarFila(["Llavero", "3,50", "", "1"], mapeo)).toEqual({
      ok: true,
      fila: { nombre: "Llavero", precio: 350, cantidad: 1, costo: 100, categoria: undefined, marca: undefined },
    });
  });

  it("el costo vacío es sin costo, no un error", () => {
    const r = validarFila(["Chaqueta", "25", "2", ""], mapeo);
    expect(r.ok && r.fila.costo).toBeNull();
  });

  it("marca todos los errores de la fila", () => {
    expect(validarFila(["", "abc", "1.5", "x"], mapeo)).toEqual({
      ok: false,
      errores: ["nombre", "precio", "cantidad", "costo"],
    });
  });

  it("sin columna de precio mapeada, toda fila falla en precio", () => {
    expect(validarFila(["Llavero", "3"], { nombre: 0 })).toEqual({ ok: false, errores: ["precio"] });
  });
});
