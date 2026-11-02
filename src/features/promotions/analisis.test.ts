import { describe, expect, it } from "vitest";
import { analizarLlevasPagas, analizarPack, nombreSugerido, pendientesDePromocion } from "./analisis";

const lineas = [
  { precio: 500, costo: 200, cantidad: 1 },
  { precio: 300, costo: 100, cantidad: 1 },
];

describe("analizarPack", () => {
  it("sin precio no hay ahorro", () => {
    expect(analizarPack(lineas, null)).toMatchObject({ normal: 800, ahorro: null, estado: "sin_precio", costo: 300, margen: null });
    expect(analizarPack(lineas, 0).estado).toBe("sin_precio");
  });

  it("calcula el ahorro, el porcentaje y lo que queda a la tienda", () => {
    expect(analizarPack(lineas, 700)).toMatchObject({ normal: 800, ahorro: 100, porcentaje: 13, costo: 300, margen: 400, estado: "ok" });
  });

  it("multiplica por las unidades de cada producto", () => {
    expect(analizarPack([{ precio: 500, costo: 200, cantidad: 2 }, { precio: 300, costo: 100, cantidad: 1 }], 1000)).toMatchObject({ normal: 1300, ahorro: 300, costo: 500, margen: 500 });
  });

  it("un pack que no cuesta menos no abarata", () => {
    expect(analizarPack(lineas, 800).estado).toBe("no_abarata");
    expect(analizarPack(lineas, 900).estado).toBe("no_abarata");
  });

  it("avisa cuando el precio queda por debajo del costo", () => {
    expect(analizarPack(lineas, 250)).toMatchObject({ estado: "perdida", margen: -50 });
    // Igual al costo no es pérdida
    expect(analizarPack(lineas, 300).estado).toBe("ok");
  });

  it("si a algún producto le falta el costo no puede decir el margen", () => {
    const r = analizarPack([{ precio: 500, costo: null, cantidad: 1 }, { precio: 300, costo: 100, cantidad: 1 }], 700);
    expect(r).toMatchObject({ costo: null, margen: null, costosFaltan: true, estado: "ok" });
  });

  it("sin productos no inventa nada", () => {
    expect(analizarPack([], 500)).toMatchObject({ normal: 0, porcentaje: null, costo: null, costosFaltan: false });
  });
});

describe("analizarLlevasPagas", () => {
  it("dice cuánto se rebaja cada unidad", () => {
    expect(analizarLlevasPagas([{ precio: 1000, costo: 400 }], 2, 1).porcentaje).toBe(50);
    expect(analizarLlevasPagas([{ precio: 1000, costo: 400 }], 3, 2).porcentaje).toBe(33);
  });

  it("calcula lo que queda por cada grupo", () => {
    // 2x1 de algo que cuesta $10 y costó $4: pagan $10, le costó $8
    expect(analizarLlevasPagas([{ precio: 1000, costo: 400 }], 2, 1)).toMatchObject({ paga: 1000, margen: 200, perdida: false });
  });

  it("avisa si el 2x1 deja pérdida", () => {
    expect(analizarLlevasPagas([{ precio: 1000, costo: 600 }], 2, 1)).toMatchObject({ margen: -200, perdida: true });
  });

  it("promedia varios productos y no adivina si falta un costo", () => {
    expect(analizarLlevasPagas([{ precio: 1000, costo: 400 }, { precio: 800, costo: 200 }], 2, 1)).toMatchObject({ paga: 900, margen: 300 });
    expect(analizarLlevasPagas([{ precio: 1000, costo: null }], 2, 1)).toMatchObject({ margen: null, costosFaltan: true, perdida: false });
  });
});

describe("pendientesDePromocion", () => {
  it("un pack necesita dos productos y un precio que abarate", () => {
    expect(pendientesDePromocion({ tipo: "pack", productos: 0, estadoPrecio: "sin_precio" })).toEqual(["productos_pack", "precio_pack"]);
    expect(pendientesDePromocion({ tipo: "pack", productos: 1, estadoPrecio: "ok" })).toEqual(["productos_pack"]);
    expect(pendientesDePromocion({ tipo: "pack", productos: 2, estadoPrecio: "no_abarata" })).toEqual(["pack_no_abarata"]);
    expect(pendientesDePromocion({ tipo: "pack", productos: 2, estadoPrecio: "perdida" })).toEqual([]);
    expect(pendientesDePromocion({ tipo: "pack", productos: 2, estadoPrecio: "ok" })).toEqual([]);
  });

  it("un 'llevá y pagá' solo necesita un producto", () => {
    expect(pendientesDePromocion({ tipo: "llevas_pagas", productos: 0, estadoPrecio: "sin_precio" })).toEqual(["productos_llevas_pagas"]);
    expect(pendientesDePromocion({ tipo: "llevas_pagas", productos: 3, estadoPrecio: "sin_precio" })).toEqual([]);
  });
});

describe("nombreSugerido", () => {
  it("un pack se llama como sus productos, sin repetir", () => {
    expect(nombreSugerido("pack", ["Funda", "Vidrio", "Funda"], 2, 1)).toBe("Funda + Vidrio");
    expect(nombreSugerido("pack", [], 2, 1)).toBe("Pack");
  });

  it("un 'llevá y pagá' dice la regla y el producto", () => {
    expect(nombreSugerido("llevas_pagas", ["Brownies"], 2, 1)).toBe("Llevá 2 y pagá 1: Brownies");
    expect(nombreSugerido("llevas_pagas", ["A", "B"], 3, 2)).toBe("Llevá 3 y pagá 2");
  });

  it("no pasa de 60 letras", () => {
    const largo = nombreSugerido("pack", ["Cheesecake de dulce de leche con fresas", "Brownies con nueces y chocolate"], 2, 1);
    expect(largo.length).toBeLessThanOrEqual(60);
    expect(largo.endsWith("…")).toBe(true);
  });
});
