import { describe, expect, it } from "vitest";
import {
  aplicarCruce,
  combinaciones,
  estadoDesdeVariantes,
  estadoVacio,
  filasParaGuardar,
  huerfanas,
  nombresDeOpciones,
  type DatosFila,
  type EstadoEditor,
} from "./editorVariantes";

const datos = (cambios: Partial<DatosFila> = {}): DatosFila => ({ id: null, precio: "12", cantidad: "2", compra: "", fotos: [], comprometidas: 0, ...cambios });
const base = { precio: "10", cantidad: "1", compra: "" };

const conValores = (e: EstadoEditor, ...valores: string[][]): EstadoEditor => ({ ...e, opciones: e.opciones.map((o, i) => ({ ...o, valores: valores[i] ?? [] })) });

describe("cruce", () => {
  it("cruza las opciones y deja afuera las quitadas", () => {
    const e = conValores(estadoVacio(base), ["Rosa", "Negro"], ["S", "M"]);
    expect(combinaciones(e)).toEqual(["Rosa · S", "Rosa · M", "Negro · S", "Negro · M"]);
    expect(combinaciones({ ...e, quitadas: ["Negro · S"] })).toHaveLength(3);
  });

  it("al elegir un cruce conserva los valores de la opción que se llama igual", () => {
    const e = aplicarCruce(conValores(estadoVacio(base), ["Rosa"], ["S"]), ["Color", "Modelo"]);
    expect(e.opciones.map((o) => [o.nombre, o.valores])).toEqual([
      ["Color", ["Rosa"]],
      ["Modelo", []],
    ]);
  });

  it("solo nombra las opciones que tienen valores", () => {
    expect(nombresDeOpciones(conValores(estadoVacio(base), ["Rosa"], []))).toEqual(["Color"]);
  });
});

describe("filasParaGuardar", () => {
  it("las combinaciones nuevas arrancan con la base; las que tienen datos los conservan", () => {
    const e = { ...conValores(aplicarCruce(estadoVacio(base), ["Sabor"]), ["Chocolate", "Vainilla"]), filas: { Vainilla: datos({ precio: "3.5" }) } };
    expect(filasParaGuardar(e)).toEqual([
      { id: null, etiqueta: "Chocolate", precio: "10", cantidad: "1", compra: "", fotos: [] },
      { id: null, etiqueta: "Vainilla", precio: "3.5", cantidad: "2", compra: "", fotos: [] },
    ]);
  });

  it("al volver «con variantes» un producto suelto, ese producto queda como la primera combinación", () => {
    const e = conValores(aplicarCruce(estadoVacio(base), ["Sabor"]), ["Chocolate", "Vainilla"]);
    expect(filasParaGuardar(e, "prod-1").map((f) => f.id)).toEqual(["prod-1", null]);
  });
});

describe("estadoDesdeVariantes", () => {
  it("reconstruye el cruce de las etiquetas y quita las combinaciones que no existían", () => {
    const e = estadoDesdeVariantes(
      [
        { etiqueta: "Rosa · S", ...datos({ id: "a" }) },
        { etiqueta: "Rosa · M", ...datos({ id: "b" }) },
        { etiqueta: "Negro · S", ...datos({ id: "c" }) },
      ],
      ["Color", "Talla"],
      base,
    );
    expect(e.opciones.map((o) => [o.nombre, o.valores])).toEqual([
      ["Color", ["Rosa", "Negro"]],
      ["Talla", ["S", "M"]],
    ]);
    expect(e.quitadas).toEqual(["Negro · M"]);
    expect(filasParaGuardar(e).map((f) => f.id)).toEqual(["a", "b", "c"]);
  });

  it("con etiquetas de distinta forma usa una sola opción con las etiquetas enteras", () => {
    const e = estadoDesdeVariantes([{ etiqueta: "Rosa · S", ...datos({ id: "a" }) }, { etiqueta: "XL", ...datos({ id: "b" }) }], [], base);
    expect(e.opciones).toHaveLength(1);
    expect(combinaciones(e)).toEqual(["Rosa · S", "XL"]);
  });

  it("si se saca un valor, la variante que existía queda huérfana (se quita al guardar)", () => {
    const e = estadoDesdeVariantes([{ etiqueta: "Chocolate", ...datos({ id: "a" }) }, { etiqueta: "Vainilla", ...datos({ id: "b" }) }], ["Sabor"], base);
    const sinVainilla = { ...e, opciones: [{ ...e.opciones[0], valores: ["Chocolate"] }] };
    expect(huerfanas(sinVainilla).map((h) => h.etiqueta)).toEqual(["Vainilla"]);
  });
});
