import { describe, expect, it } from "vitest";
import { cookieCarrito, lineasDe, MAX_CANTIDAD, MAX_LINEAS, unirTresVias } from "./carritoReglas";

describe("lineasDe", () => {
  it("lee un carrito válido", () => {
    expect(lineasDe(JSON.stringify([{ codigo: 3, cantidad: 2 }, { codigo: 5, cantidad: 1 }]))).toEqual([
      { codigo: 3, cantidad: 2 },
      { codigo: 5, cantidad: 1 },
    ]);
  });

  it("vacío, texto roto o algo que no es lista dan carrito vacío", () => {
    expect(lineasDe("")).toEqual([]);
    expect(lineasDe("{no es json")).toEqual([]);
    expect(lineasDe(JSON.stringify({ codigo: 1, cantidad: 1 }))).toEqual([]);
    expect(lineasDe("null")).toEqual([]);
  });

  it("descarta líneas sin forma válida", () => {
    const crudo = [null, 7, { codigo: "3", cantidad: 1 }, { codigo: 3.5, cantidad: 1 }, { codigo: 3, cantidad: "2" }, { codigo: 4 }, { codigo: 9, cantidad: 1 }];
    expect(lineasDe(JSON.stringify(crudo))).toEqual([{ codigo: 9, cantidad: 1 }]);
  });

  it("un código repetido cuenta una sola vez (gana la primera)", () => {
    expect(lineasDe(JSON.stringify([{ codigo: 3, cantidad: 2 }, { codigo: 3, cantidad: 9 }]))).toEqual([{ codigo: 3, cantidad: 2 }]);
  });

  it("la cantidad queda entre 1 y el tope", () => {
    expect(lineasDe(JSON.stringify([{ codigo: 1, cantidad: 0 }, { codigo: 2, cantidad: -4 }, { codigo: 3, cantidad: 999 }]))).toEqual([
      { codigo: 1, cantidad: 1 },
      { codigo: 2, cantidad: 1 },
      { codigo: 3, cantidad: MAX_CANTIDAD },
    ]);
  });

  it("no pasa del máximo de líneas", () => {
    const muchas = Array.from({ length: MAX_LINEAS + 5 }, (_, i) => ({ codigo: i + 1, cantidad: 1 }));
    expect(lineasDe(JSON.stringify(muchas))).toHaveLength(MAX_LINEAS);
  });
});

describe("cookieCarrito", () => {
  it("es una cookie por tienda", () => {
    expect(cookieCarrito("bambu")).toBe("lote_carrito_bambu");
  });
});

describe("unirTresVias", () => {
  const l = (codigo: number, cantidad: number) => ({ codigo, cantidad });

  it("lo que se quitó en este aparato no vuelve aunque el servidor siga con ello (caso a)", () => {
    expect(unirTresVias([l(1, 2), l(2, 1)], [l(2, 1)], [l(1, 2), l(2, 1)])).toEqual([l(2, 1)]);
  });

  it("lo que otro aparato quitó desaparece aquí (caso b)", () => {
    expect(unirTresVias([l(1, 2), l(2, 1)], [l(1, 2), l(2, 1)], [l(2, 1)])).toEqual([l(2, 1)]);
  });

  it("bajar de 3 a 1 se queda en 1 aunque el servidor tenga 3 (caso c)", () => {
    expect(unirTresVias([l(1, 3)], [l(1, 1)], [l(1, 3)])).toEqual([l(1, 1)]);
  });

  it("lo agregado en este aparato se conserva y lo agregado en otro llega", () => {
    expect(unirTresVias([l(1, 1)], [l(1, 1), l(2, 1)], [l(1, 1), l(3, 2)]).sort((a, b) => a.codigo - b.codigo)).toEqual([l(1, 1), l(2, 1), l(3, 2)]);
  });

  it("si no cambió aquí, gana la cantidad del servidor", () => {
    expect(unirTresVias([l(1, 1)], [l(1, 1)], [l(1, 4)])).toEqual([l(1, 4)]);
  });

  it("sin base junta todo y deja la cantidad mayor", () => {
    expect(unirTresVias(null, [l(1, 1), l(2, 5)], [l(1, 3)])).toEqual([l(1, 3), l(2, 5)]);
  });
});
