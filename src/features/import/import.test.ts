import { describe, expect, it } from "vitest";
import { textos } from "@/lib/textos";
import { parseCsv } from "./csv";
import { CAMPOS, nombreParaGuardar, proponerMapeo, resolverVariantes, validarFila } from "./mapeo";

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

  it("reconoce encabezados en inglés de una hoja de Excel", () => {
    expect(proponerMapeo(["Name", "Price", "Quantity", "Cost", "Category", "Brand"])).toEqual({
      nombre: 0,
      precio: 1,
      cantidad: 2,
      costo: 3,
      categoria: 4,
      marca: 5,
    });
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

  it("no le da la descripción ni el precio de antes al nombre o al precio", () => {
    const m = proponerMapeo(["Nombre", "Precio", "Descripción", "Precio anterior", "Condición"]);
    expect(m).toMatchObject({ nombre: 0, precio: 1, descripcion: 2, precioAnterior: 3, condicion: 4 });
  });
});

describe("validarFila", () => {
  const mapeo = { nombre: 0, precio: 1, cantidad: 2, costo: 3 };
  const base = {
    descripcion: undefined,
    condicion: "nuevo" as const,
    categoria: undefined,
    marca: undefined,
    talla: undefined,
    color: undefined,
    varianteColumna: undefined,
    etiqueta: null,
    detalles: [],
    estadoDetalle: null,
    precioAnterior: null,
  };

  it("convierte a centavos y usa cantidad 1 si viene vacía", () => {
    expect(validarFila(["Llavero", "3,50", "", "1"], mapeo)).toEqual({
      ok: true,
      fila: { nombre: "Llavero", precio: 350, cantidad: 1, costo: 100, ...base },
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

  it("llena la ficha: descripción, usado, talla y precio de antes", () => {
    const m = { nombre: 0, precio: 1, descripcion: 2, condicion: 3, talla: 4, estado: 5, precioAnterior: 6 };
    const r = validarFila(["Chaqueta", "25", "Poco uso", "usado", "M", "Una marquita", "35"], m);
    expect(r).toEqual({
      ok: true,
      fila: {
        nombre: "Chaqueta",
        precio: 2500,
        cantidad: 1,
        costo: null,
        descripcion: "Poco uso",
        condicion: "usado",
        categoria: undefined,
        marca: undefined,
        talla: "M",
        color: undefined,
        varianteColumna: undefined,
        etiqueta: null,
        detalles: [{ nombre: "Talla", valor: "M" }],
        estadoDetalle: "Una marquita",
        precioAnterior: 3500,
      },
    });
  });

  it("el estado de conservación solo queda si es usado", () => {
    const r = validarFila(["Llavero", "3", "nuevo", "sin detalles"], { nombre: 0, precio: 1, condicion: 2, estado: 3 });
    expect(r.ok && r.fila.estadoDetalle).toBeNull();
  });
});

describe("resolverVariantes", () => {
  const mapeo = { nombre: 0, precio: 1, talla: 2, color: 3 };
  const fila = (celdas: string[]) => validarFila(celdas, mapeo);

  it("una sola fila con talla sigue suelta y la talla queda en la ficha", () => {
    const r = resolverVariantes([fila(["Chaqueta", "25", "M", ""])]);
    expect(r[0]?.ok && r[0].fila.etiqueta).toBeNull();
    expect(r[0]?.ok && r[0].fila.detalles).toEqual([{ nombre: "Talla", valor: "M" }]);
  });

  it("varias filas del mismo nombre con talla y color se juntan como variantes", () => {
    const r = resolverVariantes([
      fila(["Chaqueta negra", "25", "M", "Negro"]),
      fila(["Chaqueta negra", "25", "L", "Negro"]),
      fila(["Llavero", "3.50", "", ""]),
    ]);
    expect(r[0]?.ok && r[1]?.ok && r[0].fila.grupo === r[1].fila.grupo).toBe(true);
    expect(r[0]?.ok && r[0].fila.etiqueta).toBe("M · Negro");
    expect(r[1]?.ok && r[1].fila.etiqueta).toBe("L · Negro");
    expect(r[0]?.ok && r[0].fila.opcionesVariante).toEqual(["Talla", "Color"]);
    expect(r[0]?.ok && r[0].fila.detalles).toEqual([]);
    expect(r[2]?.ok && r[2].fila.etiqueta).toBeNull();
    expect(r[0]?.ok && nombreParaGuardar(r[0].fila)).toBe("Chaqueta negra · M · Negro");
  });

  it("la columna variante gana sobre talla y color", () => {
    const m = { nombre: 0, precio: 1, variante: 2, talla: 3 };
    const r = resolverVariantes([
      validarFila(["Blusa", "12", "Rosa", "M"], m),
      validarFila(["Blusa", "12", "Celeste", "M"], m),
    ]);
    expect(r[0]?.ok && r[0].fila.etiqueta).toBe("Rosa");
    expect(r[1]?.ok && r[1].fila.etiqueta).toBe("Celeste");
    expect(r[0]?.ok && r[0].fila.opcionesVariante).toEqual(["Variante"]);
  });

  it("la variante repetida se salta y una fila sin etiqueta, si las demás sí son variantes, falla", () => {
    const r = resolverVariantes([
      fila(["Chaqueta", "25", "M", ""]),
      fila(["Chaqueta", "25", "M", ""]),
      fila(["Chaqueta", "25", "L", ""]),
      fila(["Chaqueta", "25", "", ""]),
    ]);
    expect(r[0]?.ok && r[0].fila.etiqueta).toBe("M");
    expect(r[1]).toEqual({ ok: false, errores: ["variante"] });
    expect(r[2]?.ok && r[2].fila.etiqueta).toBe("L");
    expect(r[3]).toEqual({ ok: false, errores: ["faltaVariante"] });
  });

  it("reconoce el encabezado de variante", () => {
    expect(proponerMapeo(["Nombre", "Precio", "Variante", "Talla", "Color"])).toMatchObject({
      nombre: 0,
      precio: 1,
      variante: 2,
      talla: 3,
      color: 4,
    });
  });

  it("cada campo de la importación tiene texto", () => {
    for (const c of CAMPOS) {
      expect(textos.productos.importar.campos[c]).toBeTruthy();
      expect(textos.productos.importar.columnas[c]).toBeTruthy();
    }
  });
});
