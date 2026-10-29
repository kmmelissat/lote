import { describe, expect, it } from "vitest";
import { combinarCarrito, lineasComprables, totalDe, type ProductoDelCarrito } from "./lineasCarrito";
import { lineasDe } from "./carritoReglas";

const prod = (codigo: number, extra: Partial<ProductoDelCarrito> = {}): ProductoDelCarrito => ({
  codigo,
  nombre: "Case",
  variante: "",
  foto: null,
  precio: 2000,
  disponibles: 5,
  ...extra,
});

describe("combinarCarrito", () => {
  it("usa el precio de ahora y deja la cantidad que pidió", () => {
    const [l] = combinarCarrito([{ codigo: 1, cantidad: 2 }], [prod(1, { precio: 2500 })]);
    expect(l).toMatchObject({ cantidad: 2, precio: 2500, cambio: false });
  });

  it("si quedan menos de las pedidas, baja la cantidad y lo avisa", () => {
    const [l] = combinarCarrito([{ codigo: 1, cantidad: 4 }], [prod(1, { disponibles: 2 })]);
    expect(l).toMatchObject({ cantidad: 2, cambio: true });
  });

  it("si ya no hay, queda en 0 y no se compra", () => {
    const lineas = combinarCarrito([{ codigo: 1, cantidad: 1 }, { codigo: 2, cantidad: 1 }], [prod(1, { disponibles: 0 }), prod(2)]);
    expect(lineas[0]).toMatchObject({ cantidad: 0, cambio: true });
    expect(lineasComprables(lineas).map((l) => l.codigo)).toEqual([2]);
  });

  it("un producto que ya no existe se queda afuera", () => {
    expect(combinarCarrito([{ codigo: 9, cantidad: 1 }], [prod(1)])).toEqual([]);
  });

  it("suma el total con los precios de ahora", () => {
    const lineas = combinarCarrito([{ codigo: 1, cantidad: 2 }, { codigo: 2, cantidad: 1 }], [prod(1, { precio: 2500 }), prod(2, { precio: 1900 })]);
    expect(totalDe(lineas)).toBe(6900);
  });
});

describe("lineasDe (lo guardado en el navegador)", () => {
  it("lee un carrito válido", () => {
    expect(lineasDe('[{"codigo":1,"cantidad":2}]')).toEqual([{ codigo: 1, cantidad: 2 }]);
  });

  it("no se cree lo raro: texto roto, líneas inválidas, repetidas o con cantidades fuera de tope", () => {
    expect(lineasDe("no es json")).toEqual([]);
    expect(lineasDe('{"a":1}')).toEqual([]);
    expect(lineasDe('[{"codigo":"x","cantidad":1},{"codigo":1,"cantidad":1.5},{"codigo":2,"cantidad":99},{"codigo":2,"cantidad":1}]')).toEqual([{ codigo: 2, cantidad: 20 }]);
  });

  it("no pasa de 10 líneas", () => {
    const muchas = JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ codigo: i + 1, cantidad: 1 })));
    expect(lineasDe(muchas)).toHaveLength(10);
  });
});
